import type { SupabaseClient } from "@supabase/supabase-js";

/** Borra una transacción y sincroniza fijos/cuotas que la generaron. */
export async function deleteTransactionWithSources(
  supabase: SupabaseClient,
  userId: string,
  transactionId: string
): Promise<{ error: string | null }> {
  const { data: installmentGen } = await supabase
    .from("installment_generations")
    .select("installment_id, installment_number, month, year")
    .eq("transaction_id", transactionId)
    .eq("user_id", userId)
    .maybeSingle();

  const { data: recurringGen } = await supabase
    .from("recurring_generations")
    .select("recurring_id, month, year")
    .eq("transaction_id", transactionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (installmentGen) {
    const { data: plan } = await supabase
      .from("installment_plans")
      .select("installments_paid, installments_total")
      .eq("id", installmentGen.installment_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (plan && plan.installments_paid >= installmentGen.installment_number) {
      const newPaid = installmentGen.installment_number - 1;
      await supabase
        .from("installment_plans")
        .update({
          installments_paid: newPaid,
          is_active: newPaid < plan.installments_total,
        })
        .eq("id", installmentGen.installment_id)
        .eq("user_id", userId);
    }

    await supabase.from("installment_payment_skips").upsert(
      {
        installment_id: installmentGen.installment_id,
        user_id: userId,
        installment_number: installmentGen.installment_number,
        month: installmentGen.month,
        year: installmentGen.year,
      },
      { onConflict: "installment_id,installment_number", ignoreDuplicates: true }
    );
  }

  if (recurringGen) {
    await supabase.from("recurring_month_skips").upsert(
      {
        recurring_id: recurringGen.recurring_id,
        user_id: userId,
        month: recurringGen.month,
        year: recurringGen.year,
      },
      { onConflict: "recurring_id,month,year", ignoreDuplicates: true }
    );
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

/** Borra transacciones generadas por una plantilla de fijo mensual. */
export async function deleteTransactionsForRecurring(
  supabase: SupabaseClient,
  userId: string,
  recurringId: string
): Promise<void> {
  const { data: gens } = await supabase
    .from("recurring_generations")
    .select("transaction_id")
    .eq("recurring_id", recurringId)
    .eq("user_id", userId);

  const ids = (gens ?? []).map((row) => row.transaction_id as string);
  if (!ids.length) return;

  await supabase.from("transactions").delete().in("id", ids).eq("user_id", userId);
}

/** Borra transacciones generadas por un plan a plazos. */
export async function deleteTransactionsForInstallment(
  supabase: SupabaseClient,
  userId: string,
  installmentId: string
): Promise<void> {
  const { data: gens } = await supabase
    .from("installment_generations")
    .select("transaction_id")
    .eq("installment_id", installmentId)
    .eq("user_id", userId);

  const ids = (gens ?? []).map((row) => row.transaction_id as string);
  if (!ids.length) return;

  await supabase.from("transactions").delete().in("id", ids).eq("user_id", userId);
}
