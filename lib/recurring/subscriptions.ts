import type { RecurringTransaction } from "@/types";

export const SUBSCRIPTION_CATEGORY = "Suscripciones";

export function isSubscriptionRecurring(item: RecurringTransaction): boolean {
  return item.type === "expense" && item.category === SUBSCRIPTION_CATEGORY;
}

export function filterSubscriptions(
  items: RecurringTransaction[]
): RecurringTransaction[] {
  return items.filter(isSubscriptionRecurring);
}

export function subscriptionMonthlyTotal(
  items: RecurringTransaction[]
): number {
  return filterSubscriptions(items)
    .filter((item) => item.is_active)
    .reduce((sum, item) => sum + Number(item.amount), 0);
}
