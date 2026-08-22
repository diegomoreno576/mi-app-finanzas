import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds, shouldAutoApplyMonth, toLocalDateString } from "@/lib/dashboard";
import { matchesRecurringItem } from "@/lib/recurring/dedupe";
import type { RecurringTransaction, Transaction } from "@/types";

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
  if (!shouldAutoApplyMonth(month, year)) return 0;

  const { data: recurring, error: recurringError } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (recurringError || !recurring?.length) return 0;

  const [{ data: existing }, { data: skipped }] = await Promise.all([
    supabase
      .from("recurring_generations")
      .select("recurring_id")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year),
    supabase
      .from("recurring_month_skips")
      .select("recurring_id")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year),
  ]);

  const appliedIds = new Set(
    (existing ?? []).map((row) => row.recurring_id as string)
  );
  const skippedIds = new Set(
    (skipped ?? []).map((row) => row.recurring_id as string)
  );

  const { start, end } = getMonthBounds(year, month);
  let created = 0;

  const { data: monthTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  const monthTx = (monthTransactions ?? []) as Transaction[];

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
    if (appliedIds.has(item.id) || skippedIds.has(item.id)) continue;

    const existingMatch = monthTx.find((tx) => matchesRecurringItem(tx, item));
    if (existingMatch) {
      if (await linkGeneration(item.id, existingMatch.id)) {
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
