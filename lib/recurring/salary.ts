import type { RecurringTransaction } from "@/types";

/** Plantilla de nómina mensual (categoría Salario). */
export function findMonthlySalary(
  items: RecurringTransaction[]
): RecurringTransaction | undefined {
  return items.find(
    (item) =>
      item.type === "income" &&
      item.category === "Salario" &&
      item.is_active
  );
}

export function isSalaryRecurring(item: RecurringTransaction): boolean {
  return item.type === "income" && item.category === "Salario";
}
