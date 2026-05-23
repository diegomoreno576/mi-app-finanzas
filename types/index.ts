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

export interface RecurringTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  day_of_month: number;
  is_active: boolean;
  created_at: string;
}

export interface RecurringFormData {
  amount: string;
  type: TransactionType;
  category: string;
  description: string;
  day_of_month: string;
}

export type InstallmentProvider =
  | "amazon"
  | "aplazame"
  | "cofidis"
  | "cetelem"
  | "pepper"
  | "klarna"
  | "scalapay"
  | "santander"
  | "credit_card"
  | "other";
export type InstallmentPurpose = "personal" | "favor" | "shared";
export type ReimbursementStatus = "none" | "pending" | "partial" | "settled";

export interface InstallmentPlan {
  id: string;
  user_id: string;
  title: string;
  provider: InstallmentProvider;
  purpose: InstallmentPurpose;
  beneficiary_name: string | null;
  total_amount: number;
  installment_amount: number;
  installments_total: number;
  installments_paid: number;
  payment_day: number;
  start_date: string;
  reimbursement_amount: number | null;
  reimbursement_status: ReimbursementStatus;
  reimbursed_amount: number;
  my_installment_amount: number | null;
  category: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InstallmentFormData {
  title: string;
  provider: InstallmentProvider;
  purpose: InstallmentPurpose;
  beneficiary_name: string;
  total_amount: string;
  installment_amount: string;
  installments_total: string;
  installments_paid: string;
  payment_day: string;
  start_date: string;
  reimbursement_amount: string;
  my_installment_amount: string;
  category: string;
  notes: string;
}
