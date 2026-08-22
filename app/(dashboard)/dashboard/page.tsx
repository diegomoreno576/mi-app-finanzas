import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  buildMonthlyComparisons,
  calculateMonthlySummary,
  compareMonths,
  dedupeSalaryTransactions,
  getCarryoverFetchStart,
  getCurrentMonthYear,
  getLastSixMonths,
  getMonthBounds,
  earliestMonth,
  monthKey,
  getPreviousMonth,
  getPreviousMonthCarryover,
  groupExpensesByCategory,
  resolveFirstTrackedMonth,
  shouldAutoApplyMonth,
  shouldShowPreviousMonthCarryover,
} from "@/lib/dashboard";
import { formatCurrency, getMonthName } from "@/lib/format";
import { applyRecurringForMonth } from "@/lib/recurring/apply";
import { dedupeRecurringTransactions } from "@/lib/recurring/dedupe";
import { applyInstallmentsForMonth } from "@/lib/installments/apply";
import {
  buildDashboardOverview,
  buildDisplayMonthSummary,
  buildInstallmentGenIdsByMonth,
  computeCarryoverFromTransactions,
  installmentOwnExpensesInMonth,
  unappliedRecurringTotals,
} from "@/lib/dashboard-overview";
import { StatCards } from "@/components/dashboard/StatCards";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ExpenseDonutChart } from "@/components/dashboard/ExpenseDonutChart";
import { IncomeExpenseBarChart } from "@/components/dashboard/IncomeExpenseBarChart";
import { RecentTransactionsInteractive } from "@/components/dashboard/RecentTransactionsInteractive";
import { DashboardMonthPicker } from "@/components/dashboard/DashboardMonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstallmentPlan, RecurringTransaction, Transaction } from "@/types";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const current = getCurrentMonthYear();
  const month = params.month ? Number(params.month) : current.month;
  const year = params.year ? Number(params.year) : current.year;

  const safeMonth = month >= 1 && month <= 12 ? month : current.month;
  const safeYear = year >= 2000 && year <= 2100 ? year : current.year;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (shouldAutoApplyMonth(safeMonth, safeYear)) {
    await applyRecurringForMonth(supabase, user.id, safeMonth, safeYear);
    await applyInstallmentsForMonth(supabase, user.id, safeMonth, safeYear);
  }

  const { start, end } = getMonthBounds(safeYear, safeMonth);
  const prev = getPreviousMonth(safeYear, safeMonth);
  const { end: prevEnd } = getMonthBounds(prev.year, prev.month);
  const carryoverFetchStart = getCarryoverFetchStart(safeMonth, safeYear);
  const sixMonthsAgo = getLastSixMonths()[0];
  const historyStart = getMonthBounds(
    sixMonthsAgo.year,
    sixMonthsAgo.month
  ).start;

  const [
    { data: monthTransactions },
    { data: allTransactions },
    { data: carryoverTransactions },
    { data: recent },
    { data: recurringItems },
    { data: installmentPlans },
    { data: earliestTx },
    { data: recurringGens },
    { data: recurringSkips },
    { data: installmentGens },
  ] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", historyStart),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", carryoverFetchStart)
        .lte("date", prevEnd),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("installment_plans")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("transactions")
        .select("date")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("recurring_generations")
        .select("recurring_id, month, year, transaction_id")
        .eq("user_id", user.id),
      supabase
        .from("recurring_month_skips")
        .select("recurring_id, month, year")
        .eq("user_id", user.id)
        .eq("month", safeMonth)
        .eq("year", safeYear),
      supabase
        .from("installment_generations")
        .select("month, year, transaction_id")
        .eq("user_id", user.id),
    ]);

  const recurringItemsList = (recurringItems ?? []) as RecurringTransaction[];
  const monthRecurringGens = (
    (recurringGens ?? []) as {
      recurring_id: string;
      month: number;
      year: number;
      transaction_id: string;
    }[]
  ).filter((row) => row.month === safeMonth && row.year === safeYear);

  const monthTx = dedupeRecurringTransactions(
    dedupeSalaryTransactions((monthTransactions ?? []) as Transaction[]),
    recurringItemsList,
    monthRecurringGens.map((row) => ({
      recurring_id: row.recurring_id,
      transaction_id: row.transaction_id,
    }))
  );
  const historyTx = (allTransactions ?? []) as Transaction[];
  const recentTx = (recent ?? []) as Transaction[];

  const summary = calculateMonthlySummary(monthTx);
  const installmentPlansList = (installmentPlans ?? []) as InstallmentPlan[];
  const generationMonths = [
    ...((recurringGens ?? []) as { month: number; year: number }[]),
    ...((installmentGens ?? []) as { month: number; year: number }[]),
  ].map((row) => ({ month: row.month, year: row.year }));
  const firstTrackedMonth = resolveFirstTrackedMonth(
    earliestTx?.date,
    earliestMonth(generationMonths)
  );
  const expensesByCategory = groupExpensesByCategory(monthTx);
  const monthlyComparison = buildMonthlyComparisons(
    historyTx,
    getLastSixMonths()
  );
  const monthLabel = getMonthName(safeMonth, safeYear);
  const overview = buildDashboardOverview(
    recurringItemsList,
    installmentPlansList,
    safeMonth,
    safeYear
  );
  const installmentGenMap = buildInstallmentGenIdsByMonth(
    (installmentGens ?? []) as {
      month: number;
      year: number;
      transaction_id: string;
    }[]
  );
  const monthInstallmentTxIds =
    installmentGenMap.get(monthKey(safeMonth, safeYear)) ?? [];
  const installmentInExpenses = installmentOwnExpensesInMonth(
    monthTx,
    monthInstallmentTxIds
  );
  const now = getCurrentMonthYear();
  const lockToTransactions =
    compareMonths({ month: safeMonth, year: safeYear }, now) < 0;
  const appliedRecurringIds = new Set(
    ((recurringGens ?? []) as { recurring_id: string; month: number; year: number }[])
      .filter((row) => row.month === safeMonth && row.year === safeYear)
      .map((row) => row.recurring_id)
  );
  const skippedRecurringIds = new Set(
    ((recurringSkips ?? []) as { recurring_id: string }[]).map(
      (row) => row.recurring_id
    )
  );
  const unappliedRecurring = lockToTransactions
    ? { expense: 0, income: 0 }
    : unappliedRecurringTotals(
        recurringItemsList,
        appliedRecurringIds,
        skippedRecurringIds,
        monthTx
      );
  const displaySummary = buildDisplayMonthSummary(
    overview,
    summary,
    installmentInExpenses,
    {
      lockToTransactions,
      unappliedRecurringExpense: unappliedRecurring.expense,
      unappliedRecurringIncome: unappliedRecurring.income,
    }
  );

  const carryoverRangeStart = firstTrackedMonth
    ? getMonthBounds(firstTrackedMonth.year, firstTrackedMonth.month).start
    : null;
  const carryoverTx =
    firstTrackedMonth &&
    shouldShowPreviousMonthCarryover(prev, firstTrackedMonth) &&
    carryoverRangeStart
      ? ((carryoverTransactions ?? []) as Transaction[]).filter(
          (tx) => tx.date >= carryoverRangeStart
        )
      : [];

  const carryoverBalance =
    firstTrackedMonth &&
    shouldShowPreviousMonthCarryover(prev, firstTrackedMonth)
      ? computeCarryoverFromTransactions(
          carryoverTx,
          installmentPlansList,
          installmentGenMap,
          firstTrackedMonth,
          prev,
          { viewedMonth: { month: safeMonth, year: safeYear } }
        )
      : 0;

  const carryover = getPreviousMonthCarryover(carryoverBalance, {
    previousMonth: prev,
    firstTrackedMonth,
  });

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-slate-400">Resumen de tus finanzas</p>
        </div>
        <Suspense fallback={null}>
          <DashboardMonthPicker month={safeMonth} year={safeYear} />
        </Suspense>
      </div>

      <StatCards
        summary={displaySummary}
        monthLabel={monthLabel}
        carryover={carryover}
        installmentMonthlyCommitment={overview.installments.monthlyPaymentTotal}
      />

      <DashboardOverview data={overview} monthLabel={monthLabel} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseDonutChart data={expensesByCategory} />
            {expensesByCategory.length > 0 && (
              <ul className="mt-4 space-y-2">
                {expensesByCategory.map((item) => (
                  <li
                    key={item.category}
                    className="flex justify-between text-sm text-slate-400"
                  >
                    <span>{item.category}</span>
                    <span className="font-medium text-red-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs gastos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseBarChart data={monthlyComparison} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactionsInteractive transactions={recentTx} />
        </CardContent>
      </Card>
    </div>
  );
}
