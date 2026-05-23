import {
  calculateMonthlySummary,
  compareMonths,
  getMonthBounds,
  getNextMonth,
  monthKey,
  type MonthRef,
} from "@/lib/dashboard";
import { findMonthlySalary, isSalaryRecurring } from "@/lib/recurring/salary";
import {
  filterSubscriptions,
  isSubscriptionRecurring,
  subscriptionMonthlyTotal,
} from "@/lib/recurring/subscriptions";
import {
  dueThisMonthTotal,
  getNextInstallment,
  monthlyPaymentTotal,
  myInstallmentAmount,
  providerLabel,
  remainingAmount,
  reimbursementPending,
  totalPaidByUser,
} from "@/lib/installments/helpers";
import type { InstallmentPlan, RecurringTransaction, Transaction } from "@/types";

export interface RecurringOverview {
  salaryConfigured: boolean;
  salaryAmount: number | null;
  subscriptionsTotal: number;
  subscriptionsCount: number;
  fixedExpensesTotal: number;
  fixedExpensesCount: number;
  fixedIncomesTotal: number;
  monthlyExpenseCommitment: number;
  monthlyIncomeCommitment: number;
}

export interface InstallmentDueItem {
  id: string;
  title: string;
  date: string;
  amount: number;
  provider: string;
  installmentNumber: number;
  installmentsTotal: number;
}

export interface InstallmentsOverview {
  totalRemaining: number;
  monthlyPaymentTotal: number;
  totalPaid: number;
  dueThisMonthCount: number;
  dueThisMonthAmount: number;
  pendingReimbursement: number;
  activeCount: number;
  dueThisMonth: InstallmentDueItem[];
  upcoming: InstallmentDueItem[];
}

export interface DashboardOverviewData {
  recurring: RecurringOverview;
  installments: InstallmentsOverview;
}

export function buildRecurringOverview(
  items: RecurringTransaction[]
): RecurringOverview {
  const active = items.filter((item) => item.is_active);
  const salary = findMonthlySalary(active);
  const subscriptions = filterSubscriptions(active);
  const otherExpenses = active.filter(
    (item) => item.type === "expense" && !isSubscriptionRecurring(item)
  );
  const otherIncomes = active.filter(
    (item) => item.type === "income" && !isSalaryRecurring(item)
  );

  const subscriptionsTotal = subscriptionMonthlyTotal(active);
  const fixedExpensesTotal = otherExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );
  const fixedIncomesTotal = otherIncomes.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );
  const salaryAmount = salary ? Number(salary.amount) : 0;

  return {
    salaryConfigured: !!salary,
    salaryAmount: salary ? Number(salary.amount) : null,
    subscriptionsTotal,
    subscriptionsCount: subscriptions.length,
    fixedExpensesTotal,
    fixedExpensesCount: otherExpenses.length,
    fixedIncomesTotal,
    monthlyExpenseCommitment: subscriptionsTotal + fixedExpensesTotal,
    monthlyIncomeCommitment: salaryAmount + fixedIncomesTotal,
  };
}

function toDueItem(plan: InstallmentPlan): InstallmentDueItem | null {
  const next = getNextInstallment(plan);
  if (!next) return null;

  return {
    id: plan.id,
    title: plan.title,
    date: next.date,
    amount: myInstallmentAmount(plan),
    provider: providerLabel(plan.provider),
    installmentNumber: next.number,
    installmentsTotal: plan.installments_total,
  };
}

export function buildInstallmentsOverview(
  plans: InstallmentPlan[],
  month: number,
  year: number
): InstallmentsOverview {
  const activePlans = plans.filter(
    (plan) => plan.is_active && plan.installments_paid < plan.installments_total
  );

  const dueThisMonth = activePlans
    .map((plan) => {
      const next = getNextInstallment(plan);
      if (!next || next.month !== month || next.year !== year) return null;

      return {
        id: plan.id,
        title: plan.title,
        date: next.date,
        amount: myInstallmentAmount(plan),
        provider: providerLabel(plan.provider),
        installmentNumber: next.number,
        installmentsTotal: plan.installments_total,
      };
    })
    .filter((item): item is InstallmentDueItem => item !== null);

  const upcoming = activePlans
    .map(toDueItem)
    .filter((item): item is InstallmentDueItem => item !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return {
    totalRemaining: activePlans.reduce(
      (sum, plan) => sum + remainingAmount(plan),
      0
    ),
    monthlyPaymentTotal: monthlyPaymentTotal(activePlans),
    totalPaid: totalPaidByUser(plans),
    dueThisMonthCount: dueThisMonth.length,
    dueThisMonthAmount: dueThisMonth.reduce((sum, item) => sum + item.amount, 0),
    pendingReimbursement: plans.reduce(
      (sum, plan) => sum + reimbursementPending(plan),
      0
    ),
    activeCount: activePlans.length,
    dueThisMonth,
    upcoming,
  };
}

export function buildDashboardOverview(
  recurring: RecurringTransaction[],
  installments: InstallmentPlan[],
  month: number,
  year: number
): DashboardOverviewData {
  return {
    recurring: buildRecurringOverview(recurring),
    installments: buildInstallmentsOverview(installments, month, year),
  };
}

export function projectedMonthlyBalance(
  overview: DashboardOverviewData
): number {
  const { recurring, installments } = overview;
  return (
    recurring.monthlyIncomeCommitment -
    recurring.monthlyExpenseCommitment -
    installments.monthlyPaymentTotal
  );
}

/** Suma de cierres mensuales (compromisos − plazos) hasta el mes indicado. */
export function computeCarryoverFromCommitments(
  recurring: RecurringTransaction[],
  installments: InstallmentPlan[],
  fromMonth: MonthRef,
  throughMonth: MonthRef
): number {
  let total = 0;
  let current = fromMonth;

  while (compareMonths(current, throughMonth) <= 0) {
    const overview = buildDashboardOverview(
      recurring,
      installments,
      current.month,
      current.year
    );
    total += projectedMonthlyBalance(overview);
    if (compareMonths(current, throughMonth) === 0) break;
    current = getNextMonth(current);
  }

  return total;
}

/** Cuotas a plazos propias ya registradas como gastos en el mes. */
export function installmentOwnExpensesInMonth(
  transactions: Transaction[],
  generationTransactionIds: string[]
): number {
  const ids = new Set(generationTransactionIds);
  return transactions
    .filter((tx) => tx.type === "expense" && ids.has(tx.id))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

/** Balance tras reservar lo que pagas al mes a plazos (sin doble contar gastos ya registrados). */
export function balanceAfterOwnInstallments(
  balance: number,
  monthlyOwnInstallmentTotal: number,
  alreadyInExpenses: number
): number {
  if (monthlyOwnInstallmentTotal <= 0) return balance;
  return balance - monthlyOwnInstallmentTotal + alreadyInExpenses;
}

/** Cierre de un solo mes (ingresos − gastos − plazos propios del mes). */
export function computeMonthDisplayBalance(
  summary: { balance: number },
  monthlyOwnInstallmentTotal: number,
  installmentInExpenses: number
): number {
  return balanceAfterOwnInstallments(
    summary.balance,
    monthlyOwnInstallmentTotal,
    installmentInExpenses
  );
}

/**
 * Balance total = lo que quedó el mes anterior (ya con plazos pagados)
 * + cierre de este mes (misma lógica, sin volver a descontar plazos del arrastre).
 */
export function computeTotalDisplayBalance(
  carryoverFromPreviousMonth: number,
  monthSummary: { balance: number },
  monthlyOwnInstallmentTotal: number,
  installmentInExpenses: number
): number {
  const currentMonth = computeMonthDisplayBalance(
    monthSummary,
    monthlyOwnInstallmentTotal,
    installmentInExpenses
  );
  return carryoverFromPreviousMonth + currentMonth;
}

export function buildInstallmentGenIdsByMonth(
  generations: { month: number; year: number; transaction_id: string }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of generations) {
    const key = monthKey(row.month, row.year);
    const list = map.get(key) ?? [];
    list.push(row.transaction_id);
    map.set(key, list);
  }
  return map;
}

/**
 * Balance disponible al cierre de un mes (tras cuotas a plazos),
 * encadenando arrastres desde el primer mes con datos.
 */
export function computeDisplayBalanceThroughMonth(
  transactions: Transaction[],
  installmentGenIdsByMonth: Map<string, string[]>,
  monthlyOwnInstallmentTotal: number,
  fromMonth: MonthRef,
  throughMonth: MonthRef
): number {
  let carryIn = 0;
  let current = fromMonth;

  while (compareMonths(current, throughMonth) <= 0) {
    const { start, end } = getMonthBounds(current.year, current.month);
    const monthTx = transactions.filter((t) => t.date >= start && t.date <= end);
    const summary = calculateMonthlySummary(monthTx);
    const genIds =
      installmentGenIdsByMonth.get(monthKey(current.month, current.year)) ?? [];
    const inExpenses = installmentOwnExpensesInMonth(monthTx, genIds);

    carryIn = balanceAfterOwnInstallments(
      summary.balance + carryIn,
      monthlyOwnInstallmentTotal,
      inExpenses
    );

    if (compareMonths(current, throughMonth) === 0) break;
    current = getNextMonth(current);
  }

  return carryIn;
}
