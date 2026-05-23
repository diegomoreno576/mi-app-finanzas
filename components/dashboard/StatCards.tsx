import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PreviousMonthCarryover } from "@/lib/dashboard";
import type { MonthlySummary } from "@/types";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

interface StatCardsProps {
  summary: MonthlySummary;
  monthLabel: string;
  carryover?: PreviousMonthCarryover;
  displayBalance?: number;
  currentMonthClose?: number;
  installmentMonthlyCommitment?: number;
}

export function StatCards({
  summary,
  monthLabel,
  carryover,
  displayBalance,
  currentMonthClose,
  installmentMonthlyCommitment = 0,
}: StatCardsProps) {
  const carryoverAmount = carryover?.balance ?? 0;
  const totalBalance =
    displayBalance ?? summary.balance + carryoverAmount;

  const hintLines = [
    carryover?.label != null
      ? `${carryover.label}: ${carryoverAmount > 0 ? "+" : "−"}${formatCurrency(Math.abs(carryoverAmount))}`
      : null,
    installmentMonthlyCommitment > 0
      ? `Plazos incluidos: ${formatCurrency(installmentMonthlyCommitment)}/mes`
      : null,
    currentMonthClose != null
      ? `Disponible este mes: ${formatCurrency(currentMonthClose)}`
      : null,
  ].filter(Boolean) as string[];

  const stats = [
    {
      label: "Ingresos",
      value: summary.income,
      icon: ArrowUpRight,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      span: "",
    },
    {
      label: "Gastos",
      value: summary.expense,
      icon: ArrowDownLeft,
      color: "text-red-400",
      bg: "bg-red-500/10",
      span: "",
    },
    {
      label: "Balance",
      value: totalBalance,
      icon: Wallet,
      color: totalBalance >= 0 ? "text-emerald-400" : "text-red-400",
      bg: "bg-violet-500/10",
      span: "col-span-2 lg:col-span-1",
      hints: hintLines,
    },
  ];

  return (
    <div>
      <p className="mb-3 text-sm text-slate-400 sm:mb-4">
        Resumen de {monthLabel}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color, bg, span, hints }) => (
          <Card key={label} className={cn("p-4 sm:p-5", span)}>
            <CardContent className="flex items-start justify-between gap-2 p-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-xl font-bold tabular-nums sm:mt-1 sm:text-2xl",
                    color
                  )}
                >
                  {formatCurrency(value)}
                </p>
                {hints?.map((hint) => (
                  <p
                    key={hint}
                    className="mt-1.5 text-[11px] leading-snug text-slate-500 sm:text-xs"
                  >
                    {hint}
                  </p>
                ))}
              </div>
              <div className={cn("shrink-0 rounded-lg p-2", bg)}>
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {carryover?.label != null && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="text-slate-400">{carryover.label}</span>
          <span
            className={cn(
              "font-medium tabular-nums",
              carryoverAmount > 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {carryoverAmount > 0 ? "+" : "−"}
            {formatCurrency(Math.abs(carryoverAmount))}
          </span>
        </div>
      )}
    </div>
  );
}
