import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MonthlySummary } from "@/types";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

interface StatCardsProps {
  summary: MonthlySummary;
  monthLabel: string;
}

export function StatCards({ summary, monthLabel }: StatCardsProps) {
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
      value: summary.balance,
      icon: Wallet,
      color: summary.balance >= 0 ? "text-emerald-400" : "text-red-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">Resumen de {monthLabel}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between p-0">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>
                  {formatCurrency(value)}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
