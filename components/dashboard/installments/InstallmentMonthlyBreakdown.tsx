"use client";

import { User, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { MonthlyBreakdownByPerson, PersonMonthlyBreakdown } from "@/lib/installments/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstallmentMonthlyBreakdownProps {
  breakdown: MonthlyBreakdownByPerson;
}

function BreakdownSection({
  title,
  subtitle,
  row,
  amountClassName,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  row: PersonMonthlyBreakdown;
  amountClassName: string;
  icon: typeof User;
}) {
  if (row.items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <div>
            <p className="font-medium text-slate-200">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <p className={`text-lg font-bold ${amountClassName}`}>
          {formatCurrency(row.monthlyTotal)}/mes
        </p>
      </div>
      <ul className="space-y-1.5 rounded-lg bg-slate-900/40 px-3 py-2">
        {row.items.map((item) => (
          <li
            key={item.planId}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-slate-300">{item.title}</p>
              <p className="text-xs text-slate-500">{item.provider}</p>
            </div>
            <span className="shrink-0 text-slate-400">
              {formatCurrency(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InstallmentMonthlyBreakdown({
  breakdown,
}: InstallmentMonthlyBreakdownProps) {
  const { self, partners, financierMonthlyTotal, partnersMonthlyTotal } =
    breakdown;

  const hasAny = self.items.length > 0 || partners.length > 0;

  if (!hasAny) return null;

  return (
    <Card className="border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cuotas al mes por persona</CardTitle>
        <p className="text-sm font-normal text-slate-400">
          Solo tus compras y lo compartido. Los favores van aparte en «Te deben».
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <BreakdownSection
          title="Tú pagas"
          subtitle="Tus compras y tu parte en compartidos"
          row={self}
          amountClassName="text-red-400"
          icon={User}
        />

        {partners.map((partner) => (
          <BreakdownSection
            key={partner.name}
            title={`${partner.name} paga`}
            subtitle="Su parte en financiaciones compartidas"
            row={partner}
            amountClassName="text-cyan-400"
            icon={Users}
          />
        ))}

        <div className="space-y-2 border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Tú al mes</span>
            <span className="font-semibold text-red-400">
              {formatCurrency(self.monthlyTotal)}
            </span>
          </div>
          {partnersMonthlyTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Otros al mes (compartidos)</span>
              <span className="font-semibold text-cyan-400">
                {formatCurrency(partnersMonthlyTotal)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
            <span className="font-medium text-slate-200">
              Total al financiador
            </span>
            <span className="text-xl font-bold text-white">
              {formatCurrency(financierMonthlyTotal)}/mes
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Total = tu parte + lo que pagan los demás en compartidos. Los favores
            no entran aquí: míralos en la lista de abajo y en «Te deben».
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
