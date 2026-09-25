import { createClient } from "@/lib/supabase/server";
import {
  calculateMonthlySummary,
  dedupeSalaryTransactions,
  getMonthBounds,
  shouldAutoApplyMonth,
} from "@/lib/dashboard";
import {
  buildDashboardOverview,
  projectedMonthlyBalance,
} from "@/lib/dashboard-overview";
import {
  calculateFinancialHealthFromTransactions,
  sumExpensesByBucket,
} from "@/lib/financial-health";
import { resolveMonthYear } from "@/lib/selected-month";
import { getMonthName } from "@/lib/format";
import { applyRecurringForMonth } from "@/lib/recurring/apply";
import { applyInstallmentsForMonth } from "@/lib/installments/apply";
import { DecisionsView } from "@/components/dashboard/decisions/DecisionsView";
import type { AffordabilitySnapshot } from "@/lib/affordability";
import type {
  Category,
  InstallmentPlan,
  RecurringTransaction,
  Transaction,
} from "@/types";

export const dynamic = "force-dynamic";

interface DecisionsPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DecisionsPage({ searchParams }: DecisionsPageProps) {
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

  const [
    { data: monthTransactions },
    { data: categories },
    { data: recurringItems },
    { data: installmentPlans },
  ] = await Promise.all([
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
    supabase.from("recurring_transactions").select("*").eq("user_id", user.id),
    supabase.from("installment_plans").select("*").eq("user_id", user.id),
  ]);

  const transactions = dedupeSalaryTransactions(
    (monthTransactions ?? []) as Transaction[]
  );
  const cats = (categories ?? []) as Category[];
  const summary = calculateMonthlySummary(transactions);
  const health = calculateFinancialHealthFromTransactions(
    transactions,
    cats,
    summary.income,
    summary.expense
  );
  const overview = buildDashboardOverview(
    (recurringItems ?? []) as RecurringTransaction[],
    (installmentPlans ?? []) as InstallmentPlan[],
    safeMonth,
    safeYear
  );
  const projected = projectedMonthlyBalance(overview);
  const monthLabel = getMonthName(safeMonth, safeYear);

  const snapshot: AffordabilitySnapshot = {
    monthLabel,
    income: summary.income,
    expense: summary.expense,
    monthBalance: summary.balance,
    projectedBalance: projected,
    fixedExpenseCommitment: overview.recurring.monthlyExpenseCommitment,
    installmentMonthly: overview.installments.monthlyPaymentTotal,
    incomeCommitment: overview.recurring.monthlyIncomeCommitment,
    bucketExpenses: sumExpensesByBucket(transactions, cats),
    health,
  };

  return (
    <div className="space-y-5 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Decisiones</h1>
        <p className="text-slate-400">
          ¿Me puedo permitir un gasto fijo nuevo? · {monthLabel}
        </p>
      </div>

      <DecisionsView snapshot={snapshot} />
    </div>
  );
}
