import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No hay transacciones"
        description="Las últimas transacciones aparecerán aquí"
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-700/50">
      {transactions.map((tx) => {
        const isIncome = tx.type === "income";
        return (
          <li
            key={tx.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {isIncome ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4 text-red-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">
                  {tx.description || tx.category}
                </p>
                <p className="text-sm text-slate-500">
                  {tx.category} · {formatDate(tx.date)}
                </p>
              </div>
            </div>
            <p
              className={`shrink-0 font-bold ${
                isIncome ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(Number(tx.amount))}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
