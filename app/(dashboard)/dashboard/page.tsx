import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  buildMonthlyComparisons,
  calculateMonthlySummary,
  getCurrentMonthYear,
  getLastSixMonths,
  getMonthBounds,
  groupExpensesByCategory,
} from "@/lib/dashboard";
import { formatCurrency, getMonthName } from "@/lib/format";
import { StatCards } from "@/components/dashboard/StatCards";
import { ExpenseDonutChart } from "@/components/dashboard/ExpenseDonutChart";
import { IncomeExpenseBarChart } from "@/components/dashboard/IncomeExpenseBarChart";
import { RecentTransactionsInteractive } from "@/components/dashboard/RecentTransactionsInteractive";
import { DashboardMonthPicker } from "@/components/dashboard/DashboardMonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/types";

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

  const { start, end } = getMonthBounds(safeYear, safeMonth);
  const sixMonthsAgo = getLastSixMonths()[0];
  const historyStart = getMonthBounds(
    sixMonthsAgo.year,
    sixMonthsAgo.month
  ).start;

  const [{ data: monthTransactions }, { data: allTransactions }, { data: recent }] =
    await Promise.all([
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
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const monthTx = (monthTransactions ?? []) as Transaction[];
  const historyTx = (allTransactions ?? []) as Transaction[];
  const recentTx = (recent ?? []) as Transaction[];

  const summary = calculateMonthlySummary(monthTx);
  const expensesByCategory = groupExpensesByCategory(monthTx);
  const monthlyComparison = buildMonthlyComparisons(
    historyTx,
    getLastSixMonths()
  );
  const monthLabel = getMonthName(safeMonth, safeYear);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Resumen de tus finanzas</p>
        </div>
        <Suspense fallback={null}>
          <DashboardMonthPicker month={safeMonth} year={safeYear} />
        </Suspense>
      </div>

      <StatCards summary={summary} monthLabel={monthLabel} />

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
