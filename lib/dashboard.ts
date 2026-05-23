import type {
  CategoryExpense,
  MonthlyComparison,
  MonthlySummary,
  Transaction,
} from "@/types";

/** Fecha YYYY-MM-DD en hora local (evita desfases con toISOString/UTC). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayLocal(): string {
  return toLocalDateString(new Date());
}

export function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
  };
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export interface MonthRef {
  month: number;
  year: number;
}

export function getPreviousMonth(year: number, month: number): MonthRef {
  const d = new Date(year, month - 2, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function getNextMonth({ month, year }: MonthRef): MonthRef {
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function monthKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

export function isMonthBefore(a: MonthRef, b: MonthRef): boolean {
  return compareMonths(a, b) < 0;
}

/** Solo genera fijos/cuotas en el mes actual o futuros (no rellena meses pasados). */
export function shouldAutoApplyMonth(month: number, year: number): boolean {
  const now = getCurrentMonthYear();
  return compareMonths({ month, year }, now) >= 0;
}

export function monthFromDateString(date: string): MonthRef {
  const [y, m] = date.split("-").map(Number);
  return { month: m, year: y };
}

export function getFirstTrackedMonth(
  earliestTransactionDate: string | null | undefined
): MonthRef | null {
  if (!earliestTransactionDate) return null;
  return monthFromDateString(earliestTransactionDate);
}

export function earliestMonth(months: MonthRef[]): MonthRef | null {
  if (!months.length) return null;
  return months.reduce((min, m) => (isMonthBefore(m, min) ? m : min));
}

/** Mes en el que empezaste a usar la app (prioriza generaciones automáticas). */
export function resolveFirstTrackedMonth(
  earliestTransactionDate: string | null | undefined,
  earliestGenerationMonth: MonthRef | null
): MonthRef | null {
  const fromTransactions = getFirstTrackedMonth(earliestTransactionDate);

  if (earliestGenerationMonth) {
    return earliestGenerationMonth;
  }

  return fromTransactions;
}

export function shouldShowPreviousMonthCarryover(
  previousMonth: MonthRef,
  firstTrackedMonth: MonthRef | null
): boolean {
  if (!firstTrackedMonth) return false;
  return compareMonths(previousMonth, firstTrackedMonth) >= 0;
}

export interface PreviousMonthCarryover {
  balance: number;
  label: "Restante del mes anterior" | "Deuda del mes anterior" | null;
}

export function getPreviousMonthCarryover(
  previousMonthBalance: number,
  options: {
    previousMonth: MonthRef;
    firstTrackedMonth: MonthRef | null;
  }
): PreviousMonthCarryover {
  if (
    !shouldShowPreviousMonthCarryover(
      options.previousMonth,
      options.firstTrackedMonth
    )
  ) {
    return { balance: 0, label: null };
  }

  if (previousMonthBalance > 0) {
    return {
      balance: previousMonthBalance,
      label: "Restante del mes anterior",
    };
  }
  if (previousMonthBalance < 0) {
    return {
      balance: previousMonthBalance,
      label: "Deuda del mes anterior",
    };
  }
  return { balance: 0, label: null };
}

/** Inicio de ventana para calcular arrastres (hasta 12 meses antes del mes visto). */
export function getCarryoverFetchStart(viewMonth: number, viewYear: number): string {
  const d = new Date(viewYear, viewMonth - 13, 1);
  return getMonthBounds(d.getFullYear(), d.getMonth() + 1).start;
}

export function getLastSixMonths(): { month: number; year: number; label: string; key: string }[] {
  const months: { month: number; year: number; label: string; key: string }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    months.push({
      month,
      year,
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
    });
  }

  return months;
}

export function calculateMonthlySummary(
  transactions: Transaction[]
): MonthlySummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

export function groupExpensesByCategory(
  transactions: Transaction[]
): CategoryExpense[] {
  const map = new Map<string, number>();

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    });

  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildMonthlyComparisons(
  transactions: Transaction[],
  months: { month: number; year: number; label: string; key: string }[]
): MonthlyComparison[] {
  return months.map(({ month, year, label, key }) => {
    const { start, end } = getMonthBounds(year, month);
    const monthTx = transactions.filter((t) => t.date >= start && t.date <= end);
    const summary = calculateMonthlySummary(monthTx);
    return {
      month: label,
      monthKey: key,
      income: summary.income,
      expense: summary.expense,
    };
  });
}
