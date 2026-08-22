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
  installmentMonthlyCommitment?: number;
}

export function StatCards({
  summary,
  monthLabel,
  carryover,
  installmentMonthlyCommitment = 0,
}: StatCardsProps) {
  const carryoverAmount = carryover?.balance ?? 0;
  const monthBalance = summary.income - summary.expense;

  const hintLines = [
    installmentMonthlyCommitment > 0
      ? `Plazos incluidos: ${formatCurrency(installmentMonthlyCommitment)}/mes`
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
      label: "Balance del mes",
      value: monthBalance,
      icon: Wallet,
      color: monthBalance >= 0 ? "text-emerald-400" : "text-red-400",
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
        <div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">{carryover.label}</p>
              <p className="text-xs text-slate-500">
                Solo informativo · no se suma al balance del mes
              </p>
            </div>
            <span
              className={cn(
                "text-lg font-semibold tabular-nums sm:text-base",
                carryoverAmount > 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {carryoverAmount > 0 ? "+" : "−"}
              {formatCurrency(Math.abs(carryoverAmount))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
