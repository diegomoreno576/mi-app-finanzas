import type { SupabaseClient } from "@supabase/supabase-js";
import { getInstallmentDueDate, myInstallmentAmount } from "@/lib/installments/helpers";
import { toLocalDateString } from "@/lib/dashboard";
import type { InstallmentPlan } from "@/types";

export async function applyInstallmentsForMonth(
  supabase: SupabaseClient,
  userId: string,
  month: number,
  year: number
): Promise<number> {
  const { data: plans, error: plansError } = await supabase
    .from("installment_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (plansError || !plans?.length) return 0;

  const [{ data: existing }, { data: skippedRows }] = await Promise.all([
    supabase
      .from("installment_generations")
      .select("installment_id, installment_number")
      .eq("user_id", userId),
    supabase
      .from("installment_payment_skips")
      .select("installment_id, installment_number")
      .eq("user_id", userId),
  ]);

  const applied = new Set(
    (existing ?? []).map(
      (row) => `${row.installment_id as string}:${row.installment_number as number}`
    )
  );
  const skippedKeys = new Set(
    (skippedRows ?? []).map(
      (row) => `${row.installment_id as string}:${row.installment_number as number}`
    )
  );

  let created = 0;

  for (const plan of plans as InstallmentPlan[]) {
    if (plan.installments_paid >= plan.installments_total) continue;

    const installmentNumber = plan.installments_paid + 1;
    const key = `${plan.id}:${installmentNumber}`;
    if (applied.has(key) || skippedKeys.has(key)) continue;

    const due = getInstallmentDueDate(plan, installmentNumber);
    if (due.getMonth() + 1 !== month || due.getFullYear() !== year) continue;

    const description = [
      plan.title,
      `· cuota ${installmentNumber}/${plan.installments_total}`,
      plan.purpose === "favor" && plan.beneficiary_name
        ? `(para ${plan.beneficiary_name})`
        : null,
      plan.purpose === "shared" && plan.beneficiary_name
        ? `(compartido con ${plan.beneficiary_name})`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: myInstallmentAmount(plan),
        type: "expense",
        category: plan.category,
        description,
        date: toLocalDateString(due),
      })
      .select("id")
      .single();

    if (txError || !transaction) continue;

    const { error: genError } = await supabase.from("installment_generations").insert({
      installment_id: plan.id,
      user_id: userId,
      installment_number: installmentNumber,
      month,
      year,
      transaction_id: transaction.id,
    });

    if (genError) continue;

    const newPaid = installmentNumber;
    const completed = newPaid >= plan.installments_total;

    await supabase
      .from("installment_plans")
      .update({
        installments_paid: newPaid,
        is_active: completed ? false : plan.is_active,
      })
      .eq("id", plan.id);

    created++;
  }

  return created;
}
