import { createClient } from "@/lib/supabase/server";
import {
  calculateMonthlySummary,
  dedupeSalaryTransactions,
  getMonthBounds,
  shouldAutoApplyMonth,
} from "@/lib/dashboard";
import { resolveMonthYear } from "@/lib/selected-month";
import { getMonthName } from "@/lib/format";
import { applyRecurringForMonth } from "@/lib/recurring/apply";
import { applyInstallmentsForMonth } from "@/lib/installments/apply";
import {
  calculateFinancialHealthFromTransactions,
  buildHealthCategoryBreakdown,
} from "@/lib/financial-health";
import { HealthView } from "@/components/dashboard/health/HealthView";
import type { Category, Transaction } from "@/types";

export const dynamic = "force-dynamic";

interface HealthPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function HealthPage({ searchParams }: HealthPageProps) {
  const params = await searchParams;
  const { month: safeMonth, year: safeYear } = resolveMonthYear(params);

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

  const [{ data: monthTransactions }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "expense"),
  ]);

  const transactions = dedupeSalaryTransactions(
    (monthTransactions ?? []) as Transaction[]
  );
  const summary = calculateMonthlySummary(transactions);
  const health = calculateFinancialHealthFromTransactions(
    transactions,
    (categories ?? []) as Category[],
    summary.income,
    summary.expense
  );
  const categoryBreakdown = buildHealthCategoryBreakdown(
    transactions,
    (categories ?? []) as Category[],
    health.balance
  );

  const monthLabel = getMonthName(safeMonth, safeYear);

  return (
    <div className="space-y-5 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Salud financiera</h1>
        <p className="text-slate-400">Regla 50/30/20 · {monthLabel}</p>
      </div>

      <HealthView
        health={health}
        monthLabel={monthLabel}
        categoryBreakdown={categoryBreakdown}
      />
    </div>
  );
}
