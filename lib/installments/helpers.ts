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

/** Planes que cuentan como tu gasto a plazos (sin favores que adelantas). */
export function isOwnInstallmentExpense(plan: InstallmentPlan): boolean {
  return plan.purpose === "personal" || plan.purpose === "shared";
}

/** Suma de tu parte de cuota en planes activos (sin favores). */
export function monthlyPaymentTotal(plans: InstallmentPlan[]): number {
  return plans
    .filter(
      (plan) =>
        plan.is_active &&
        !isInstallmentComplete(plan) &&
        isOwnInstallmentExpense(plan)
    )
    .reduce((sum, plan) => sum + myInstallmentAmount(plan), 0);
}

/** Importe que te toca pagar este mes (sin favores). */
export function dueThisMonthTotal(
  plans: InstallmentPlan[],
  month: number,
  year: number
): number {
  return plans
    .filter(
      (plan) =>
        plan.is_active &&
        !isInstallmentComplete(plan) &&
        isOwnInstallmentExpense(plan)
    )
    .reduce((sum, plan) => {
      const next = getNextInstallment(plan);
      if (next?.month === month && next?.year === year) {
        return sum + myInstallmentAmount(plan);
      }
      return sum;
    }, 0);
}

/** Total ya pagado según cuotas registradas en la app. */
export function totalPaidByUser(plans: InstallmentPlan[]): number {
  return plans.reduce((sum, plan) => sum + paidAmount(plan), 0);
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

export interface BreakdownItem {
  planId: string;
  title: string;
  provider: string;
  amount: number;
}

export interface PersonMonthlyBreakdown {
  name: string;
  kind: "self" | "partner" | "favor";
  monthlyTotal: number;
  items: BreakdownItem[];
}

export interface MonthlyBreakdownByPerson {
  self: PersonMonthlyBreakdown;
  partners: PersonMonthlyBreakdown[];
  favors: PersonMonthlyBreakdown[];
  financierMonthlyTotal: number;
  myMonthlyTotal: number;
  partnersMonthlyTotal: number;
}

function activePlans(plans: InstallmentPlan[]): InstallmentPlan[] {
  return plans.filter((plan) => plan.is_active && !isInstallmentComplete(plan));
}

export function buildMonthlyBreakdownByPerson(
  plans: InstallmentPlan[]
): MonthlyBreakdownByPerson {
  const active = activePlans(plans);

  const self: PersonMonthlyBreakdown = {
    name: "Tú",
    kind: "self",
    monthlyTotal: 0,
    items: [],
  };
  const partnerMap = new Map<string, PersonMonthlyBreakdown>();

  for (const plan of active) {
    if (plan.purpose === "favor") continue;

    const baseItem = {
      planId: plan.id,
      title: plan.title,
      provider: providerLabel(plan.provider),
      amount: 0,
    };

    if (plan.purpose === "personal") {
      const amount = myInstallmentAmount(plan);
      self.items.push({ ...baseItem, amount });
      self.monthlyTotal += amount;
      continue;
    }

    if (plan.purpose === "shared") {
      const myAmount = myInstallmentAmount(plan);
      const partnerAmount = partnerInstallmentAmount(plan);
      const partnerName = plan.beneficiary_name?.trim() || "Otro";

      self.items.push({
        ...baseItem,
        title: `${plan.title} (tu parte)`,
        amount: myAmount,
      });
      self.monthlyTotal += myAmount;

      const partner =
        partnerMap.get(partnerName) ??
        ({
          name: partnerName,
          kind: "partner",
          monthlyTotal: 0,
          items: [],
        } satisfies PersonMonthlyBreakdown);

      partner.items.push({
        ...baseItem,
        title: `${plan.title} (su parte)`,
        amount: partnerAmount,
      });
      partner.monthlyTotal += partnerAmount;
      partnerMap.set(partnerName, partner);
    }
  }

  const partners = [...partnerMap.values()].sort(
    (a, b) => b.monthlyTotal - a.monthlyTotal
  );

  const ownPlans = active.filter(isOwnInstallmentExpense);

  return {
    self,
    partners,
    favors: [],
    financierMonthlyTotal: ownPlans.reduce(
      (sum, plan) => sum + Number(plan.installment_amount),
      0
    ),
    myMonthlyTotal: self.monthlyTotal,
    partnersMonthlyTotal: partners.reduce(
      (sum, partner) => sum + partner.monthlyTotal,
      0
    ),
  };
}
