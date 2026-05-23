export type TransactionType = "income" | "expense";
export type CategoryType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  color?: string;
}

export interface MonthlyComparison {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
}

export interface BudgetWithDetails extends Budget {
  category?: Category;
  spent: number;
}

export interface TransactionFilters {
  month: number;
  year: number;
  type: TransactionType | "";
  category: string;
  page: number;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
}

export interface TransactionFormData {
  amount: string;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}
