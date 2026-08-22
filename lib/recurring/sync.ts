import type { SupabaseClient } from "@supabase/supabase-js";
import {
  compareMonths,
  getCurrentMonthYear,
  getMonthBounds,
  type MonthRef,
} from "@/lib/dashboard";
import { applyRecurringForMonth } from "@/lib/recurring/apply";
import type { RecurringFormData } from "@/types";

function isMonthOnOrAfterCurrent({ month, year }: MonthRef): boolean {
  return compareMonths({ month, year }, getCurrentMonthYear()) >= 0;
}

/** Actualiza la transacción ya generada de un mes concreto (no toca otros meses). */
export async function syncRecurringToMonthTransaction(
  supabase: SupabaseClient,
  userId: string,
  recurringId: string,
  form: RecurringFormData,
  month: number,
  year: number
): Promise<void> {
  if (!isMonthOnOrAfterCurrent({ month, year })) return;

  const { data: generation } = await supabase
    .from("recurring_generations")
    .select("transaction_id")
    .eq("recurring_id", recurringId)
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (!generation?.transaction_id) return;

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("date")
    .eq("id", generation.transaction_id as string)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingTx?.date) return;

  const { start, end } = getMonthBounds(year, month);
  if (existingTx.date < start || existingTx.date > end) return;

  const amount = parseFloat(form.amount);

  await supabase
    .from("transactions")
    .update({
      amount,
      type: form.type,
      category: form.category,
      description: form.description || null,
    })
    .eq("id", generation.transaction_id as string)
    .eq("user_id", userId);
}

/**
 * Propaga un fijo editado al mes actual y posteriores.
 * Meses anteriores a hoy quedan con el importe que ya tenían registrado.
 */
export async function syncRecurringFromCurrentMonthForward(
  supabase: SupabaseClient,
  userId: string,
  recurringId: string,
  form: RecurringFormData
): Promise<void> {
  const from = getCurrentMonthYear();
  const amount = parseFloat(form.amount);

  const { data: generations } = await supabase
    .from("recurring_generations")
    .select("transaction_id, month, year")
    .eq("recurring_id", recurringId)
    .eq("user_id", userId);

  for (const gen of generations ?? []) {
    const genMonth = { month: gen.month as number, year: gen.year as number };
    if (!isMonthOnOrAfterCurrent(genMonth)) continue;

    const { start, end } = getMonthBounds(genMonth.year, genMonth.month);
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("date")
      .eq("id", gen.transaction_id as string)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingTx?.date) continue;
    if (existingTx.date < start || existingTx.date > end) continue;

    await supabase
      .from("transactions")
      .update({
        amount,
        type: form.type,
        category: form.category,
        description: form.description || null,
      })
      .eq("id", gen.transaction_id as string)
      .eq("user_id", userId);
  }

  await applyRecurringForMonth(supabase, userId, from.month, from.year);
}
