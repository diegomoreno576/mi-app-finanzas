import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds, toLocalDateString } from "@/lib/dashboard";
import type { RecurringTransaction } from "@/types";

function getDayInMonth(day: number, month: number, year: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(day, lastDay);
}

function buildRecurringDate(day: number, month: number, year: number): string {
  const safeDay = getDayInMonth(day, month, year);
  return toLocalDateString(new Date(year, month - 1, safeDay));
}

export async function applyRecurringForMonth(
  supabase: SupabaseClient,
  userId: string,
  month: number,
  year: number
): Promise<number> {
  const { data: recurring, error: recurringError } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (recurringError || !recurring?.length) return 0;

  const { data: existing } = await supabase
    .from("recurring_generations")
    .select("recurring_id")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year);

  const appliedIds = new Set(
    (existing ?? []).map((row) => row.recurring_id as string)
  );

  const { start, end } = getMonthBounds(year, month);
  let created = 0;

  async function linkGeneration(
    recurringId: string,
    transactionId: string
  ): Promise<boolean> {
    const { error: genError } = await supabase
      .from("recurring_generations")
      .insert({
        recurring_id: recurringId,
        user_id: userId,
        month,
        year,
        transaction_id: transactionId,
      });
    return !genError;
  }

  for (const item of recurring as RecurringTransaction[]) {
    if (appliedIds.has(item.id)) continue;

    const { data: existingInMonth } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("type", item.type)
      .eq("category", item.category)
      .gte("date", start)
      .lte("date", end)
      .limit(1);

    if (existingInMonth?.[0]) {
      if (await linkGeneration(item.id, existingInMonth[0].id as string)) {
        created++;
      }
      continue;
    }

    const date = buildRecurringDate(item.day_of_month, month, year);

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: item.amount,
        type: item.type,
        category: item.category,
        description: item.description,
        date,
      })
      .select("id")
      .single();

    if (txError || !transaction) continue;

    if (await linkGeneration(item.id, transaction.id as string)) {
      created++;
    }
  }

  return created;
}
