import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { PreviousMonthCarryover } from "@/lib/dashboard";
import type { MonthlySummary } from "@/types";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

interface StatCardsProps {
  summary: MonthlySummary;
  monthLabel: string;
  carryover?: PreviousMonthCarryover;
  displayBalance?: number;
  installmentMonthlyCommitment?: number;
}

export function StatCards({
  summary,
  monthLabel,
  carryover,
  displayBalance,
  installmentMonthlyCommitment = 0,
}: StatCardsProps) {
  const carryoverAmount = carryover?.balance ?? 0;
  const totalBalance =
    displayBalance ?? summary.balance + carryoverAmount;

  const stats = [
    {
      label: "Ingresos",
      value: summary.income,
      icon: ArrowUpRight,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Gastos",
      value: summary.expense,
      icon: ArrowDownLeft,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Balance",
      value: totalBalance,
      icon: Wallet,
      color: totalBalance >= 0 ? "text-emerald-400" : "text-red-400",
      bg: "bg-violet-500/10",
      hint: [
        carryover?.label != null
          ? `${carryover.label} (tras cuotas): ${carryoverAmount > 0 ? "+" : "−"}${formatCurrency(Math.abs(carryoverAmount))}`
          : null,
        installmentMonthlyCommitment > 0
          ? `Este mes tras plazos: −${formatCurrency(installmentMonthlyCommitment)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">Resumen de {monthLabel}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color, bg, hint }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between p-0">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {formatCurrency(value)}
                </p>
                {hint && (
                  <p className="mt-1 text-xs text-slate-500">{hint}</p>
                )}
              </div>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {carryover?.label != null && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm">
          <span className="text-slate-400">{carryover.label}</span>
          <span
            className={
              carryoverAmount > 0 ? "font-medium text-emerald-400" : "font-medium text-red-400"
            }
          >
            {carryoverAmount > 0 ? "+" : "−"}
            {formatCurrency(Math.abs(carryoverAmount))}
          </span>
        </div>
      )}
    </div>
  );
}
