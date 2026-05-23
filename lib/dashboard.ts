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
