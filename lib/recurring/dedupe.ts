import type { RecurringTransaction, Transaction } from "@/types";

export function matchesRecurringItem(
  tx: Transaction,
  item: RecurringTransaction
): boolean {
  if (tx.type !== item.type || tx.category !== item.category) return false;
  const desc = item.description?.trim();
  if (desc) return tx.description?.trim() === desc;
  return Math.abs(Number(tx.amount) - Number(item.amount)) < 0.01;
}

interface RecurringGenerationRef {
  recurring_id: string;
  transaction_id: string;
}

/**
 * Una sola transacción por plantilla fija y mes (evita duplicados por apply/sync).
 * Prioriza la enlazada en recurring_generations.
 */
export function dedupeRecurringTransactions(
  transactions: Transaction[],
  recurringItems: RecurringTransaction[],
  generations: RecurringGenerationRef[] = []
): Transaction[] {
  const genTxIds = new Set(generations.map((g) => g.transaction_id));
  const skip = new Set<string>();

  for (const item of recurringItems) {
    if (!item.is_active) continue;

    const matches = transactions.filter((tx) => matchesRecurringItem(tx, item));
    if (matches.length <= 1) continue;

    const linked = matches.find((tx) => genTxIds.has(tx.id));
    const keep = linked
      ? linked
      : [...matches].sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.created_at.localeCompare(b.created_at)
        )[0];

    for (const tx of matches) {
      if (tx.id !== keep.id) skip.add(tx.id);
    }
  }

  return transactions.filter((tx) => !skip.has(tx.id));
}
