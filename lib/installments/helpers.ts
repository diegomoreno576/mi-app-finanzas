import { toLocalDateString } from "@/lib/dashboard";
import type { InstallmentPlan } from "@/types";

export const INSTALLMENT_PROVIDERS = {
  amazon: "Amazon",
  aplazame: "Aplázame",
  cofidis: "Cofidis",
  cetelem: "Cetelem",
  pepper: "Pepper",
  klarna: "Klarna",
  scalapay: "Scalapay",
  santander: "Santander",
  credit_card: "Tarjeta de crédito",
  other: "Otros",
} as const;

export type InstallmentProvider = keyof typeof INSTALLMENT_PROVIDERS;

export const INSTALLMENT_PURPOSES = {
  personal: "Para mí",
  favor: "Favor / para alguien",
  shared: "Compartido / pago con alguien",
} as const;

export function myInstallmentAmount(plan: InstallmentPlan): number {
  if (plan.purpose === "shared" && plan.my_installment_amount != null) {
    return Number(plan.my_installment_amount);
  }
  return Number(plan.installment_amount);
}

export function partnerInstallmentAmount(plan: InstallmentPlan): number {
  return Math.max(Number(plan.installment_amount) - myInstallmentAmount(plan), 0);
}

export function getInstallmentDueDate(
  plan: Pick<InstallmentPlan, "start_date" | "payment_day">,
  installmentNumber: number
): Date {
  const [year, month, startDay] = plan.start_date.split("-").map(Number);

  if (installmentNumber === 1) {
    return new Date(year, month - 1, startDay);
  }

  const due = new Date(year, month - 1 + (installmentNumber - 1), 1);
  const lastDay = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate();
  due.setDate(Math.min(plan.payment_day, lastDay));
  return due;
}

export function getNextInstallment(
  plan: InstallmentPlan
): { number: number; month: number; year: number; date: string } | null {
  if (plan.installments_paid >= plan.installments_total) return null;

  const number = plan.installments_paid + 1;
  const due = getInstallmentDueDate(plan, number);

  return {
    number,
    month: due.getMonth() + 1,
    year: due.getFullYear(),
    date: toLocalDateString(due),
  };
}

export function remainingInstallments(plan: InstallmentPlan): number {
  return Math.max(plan.installments_total - plan.installments_paid, 0);
}

export function remainingAmount(plan: InstallmentPlan): number {
  return remainingInstallments(plan) * myInstallmentAmount(plan);
}

export function remainingFinancierAmount(plan: InstallmentPlan): number {
  return remainingInstallments(plan) * Number(plan.installment_amount);
}

export function paidAmount(plan: InstallmentPlan): number {
  return plan.installments_paid * myInstallmentAmount(plan);
}

export function reimbursementPending(plan: InstallmentPlan): number {
  if (
    (plan.purpose !== "favor" && plan.purpose !== "shared") ||
    !plan.reimbursement_amount
  ) {
    return 0;
  }
  return Math.max(
    Number(plan.reimbursement_amount) - Number(plan.reimbursed_amount),
    0
  );
}

export function isInstallmentComplete(plan: InstallmentPlan): boolean {
  return plan.installments_paid >= plan.installments_total;
}

export function providerLabel(provider: InstallmentProvider | string): string {
  return (
    INSTALLMENT_PROVIDERS[provider as InstallmentProvider] ?? String(provider)
  );
}

export function purposeLabel(purpose: InstallmentPlan["purpose"]): string {
  return INSTALLMENT_PURPOSES[purpose];
}

export function needsPartnerName(purpose: InstallmentPlan["purpose"]): boolean {
  return purpose === "favor" || purpose === "shared";
}
