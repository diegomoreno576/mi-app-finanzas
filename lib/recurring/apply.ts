import type { SupabaseClient } from "@supabase/supabase-js";
import { toLocalDateString } from "@/lib/dashboard";
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

  let created = 0;

  for (const item of recurring as RecurringTransaction[]) {
    if (appliedIds.has(item.id)) continue;

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

    const { error: genError } = await supabase
      .from("recurring_generations")
      .insert({
        recurring_id: item.id,
        user_id: userId,
        month,
        year,
        transaction_id: transaction.id,
      });

    if (!genError) created++;
  }

  return created;
}
