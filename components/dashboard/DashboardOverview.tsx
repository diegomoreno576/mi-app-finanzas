import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  ChevronRight,
  CreditCard,
  HandCoins,
  Layers,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DashboardOverviewData } from "@/lib/dashboard-overview";
import { projectedMonthlyBalance } from "@/lib/dashboard-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardOverviewProps {
  data: DashboardOverviewData;
  monthLabel: string;
}

export function DashboardOverview({ data, monthLabel }: DashboardOverviewProps) {
  const { recurring, installments } = data;
  const projected = projectedMonthlyBalance(data);
  const hasRecurring =
    recurring.salaryConfigured ||
    recurring.subscriptionsCount > 0 ||
    recurring.fixedExpensesCount > 0 ||
    recurring.fixedIncomesTotal > 0;
  const hasInstallments =
    installments.activeCount > 0 || installments.pendingReimbursement > 0;

  if (!hasRecurring && !hasInstallments) {
    return (
      <Card className="border-violet-500/30 bg-violet-600/5">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-violet-200">Configura tus finanzas automáticas</p>
            <p className="mt-1 text-sm text-slate-400">
              Nómina, suscripciones, gastos fijos y compras a plazos se registran solas
              cada mes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/recurring"
              className="rounded-lg bg-violet-600/30 px-3 py-2 text-sm text-violet-200 hover:bg-violet-600/40"
            >
              Fijos mensuales
            </Link>
            <Link
              href="/dashboard/installments"
              className="rounded-lg bg-violet-600/30 px-3 py-2 text-sm text-violet-200 hover:bg-violet-600/40"
            >
              Plazos y favores
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Compromisos automáticos</h2>
          <p className="text-sm text-slate-400">
            Lo que entra y sale por nómina, fijos y cuotas en {monthLabel}
          </p>
        </div>
        <p
          className={`shrink-0 text-sm font-medium tabular-nums ${
            projected >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          Proyección del mes: {formatCurrency(projected)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Fijos mensuales</CardTitle>
            <Link
              href="/dashboard/recurring"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
            >
              Gestionar
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-600/10 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                Nómina
              </div>
              {recurring.salaryConfigured ? (
                <span className="font-semibold text-emerald-400">
                  +{formatCurrency(recurring.salaryAmount ?? 0)}
                </span>
              ) : (
                <Link
                  href="/dashboard/recurring"
                  className="text-xs text-slate-500 hover:text-violet-300"
                >
                  Configurar →
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-600/10 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CreditCard className="h-4 w-4 text-indigo-400" />
                Suscripciones
                {recurring.subscriptionsCount > 0 && (
                  <span className="text-xs text-slate-500">
                    ({recurring.subscriptionsCount})
                  </span>
                )}
              </div>
              <span className="font-semibold text-indigo-300">
                {recurring.subscriptionsCount > 0
                  ? `-${formatCurrency(recurring.subscriptionsTotal)}`
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-800/50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CalendarClock className="h-4 w-4 text-violet-400" />
                Otros gastos fijos
                {recurring.fixedExpensesCount > 0 && (
                  <span className="text-xs text-slate-500">
                    ({recurring.fixedExpensesCount})
                  </span>
                )}
              </div>
              <span className="font-semibold text-red-400">
                {recurring.fixedExpensesCount > 0
                  ? `-${formatCurrency(recurring.fixedExpensesTotal)}`
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-700/50 pt-3 text-sm">
              <span className="text-slate-400">Balance fijos/mes</span>
              <span
                className={`font-semibold ${
                  recurring.monthlyIncomeCommitment -
                    recurring.monthlyExpenseCommitment >=
                  0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {formatCurrency(
                  recurring.monthlyIncomeCommitment -
                    recurring.monthlyExpenseCommitment
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Plazos y favores</CardTitle>
            <Link
              href="/dashboard/installments"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
            >
              Gestionar
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-red-600/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  Pagas al mes
                </div>
                <p className="mt-1 font-semibold text-red-300">
                  {formatCurrency(installments.monthlyPaymentTotal)}
                </p>
              </div>
              <div className="rounded-lg bg-violet-600/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Wallet className="h-3.5 w-3.5" />
                  Deuda restante
                </div>
                <p className="mt-1 font-semibold text-violet-300">
                  {formatCurrency(installments.totalRemaining)}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-600/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Layers className="h-3.5 w-3.5" />
                  Cuotas {monthLabel}
                </div>
                <p className="mt-1 font-semibold text-indigo-300">
                  {installments.dueThisMonthCount > 0
                    ? `${installments.dueThisMonthCount} · ${formatCurrency(installments.dueThisMonthAmount)}`
                    : "Ninguna"}
                </p>
              </div>
            </div>

            {installments.pendingReimbursement > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-600/10 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <HandCoins className="h-4 w-4 text-amber-400" />
                  Te deben
                </div>
                <span className="font-semibold text-amber-300">
                  {formatCurrency(installments.pendingReimbursement)}
                </span>
              </div>
            )}

            {installments.dueThisMonth.length > 0 ? (
              <ul className="space-y-2 border-t border-slate-700/50 pt-3">
                {installments.dueThisMonth.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.provider} · cuota {item.installmentNumber}/
                        {item.installmentsTotal} · {formatDate(item.date)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-red-400">
                      -{formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : installments.upcoming.length > 0 ? (
              <ul className="space-y-2 border-t border-slate-700/50 pt-3">
                <p className="text-xs text-slate-500">Próximas cuotas</p>
                {installments.upcoming.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(item.date)} · {item.provider}
                      </p>
                    </div>
                    <span className="shrink-0 text-slate-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-slate-700/50 pt-3 text-sm text-slate-500">
                {installments.activeCount > 0
                  ? "Sin cuotas pendientes este mes."
                  : "Sin financiaciones activas."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
