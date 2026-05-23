"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyInstallmentsForMonth } from "@/lib/installments/apply";
import type {
  InstallmentFormData,
  InstallmentPlan,
  ReimbursementStatus,
} from "@/types";

function parseInstallmentForm(form: InstallmentFormData) {
  const totalAmount = parseFloat(form.total_amount);
  const installmentAmount = parseFloat(form.installment_amount);
  const installmentsTotal = parseInt(form.installments_total, 10);
  const installmentsPaid = parseInt(form.installments_paid || "0", 10);
  const paymentDay = parseInt(form.payment_day, 10);
  const reimbursementAmount = form.reimbursement_amount
    ? parseFloat(form.reimbursement_amount)
    : null;

  if (!form.title.trim()) return { error: "Indica un nombre para la compra." };
  if (isNaN(totalAmount) || totalAmount <= 0) {
    return { error: "El importe total debe ser mayor que 0." };
  }
  if (isNaN(installmentAmount) || installmentAmount <= 0) {
    return { error: "El importe de la cuota debe ser mayor que 0." };
  }
  if (isNaN(installmentsTotal) || installmentsTotal < 1) {
    return { error: "Debe haber al menos 1 cuota." };
  }
  if (isNaN(installmentsPaid) || installmentsPaid < 0) {
    return { error: "Las cuotas pagadas no pueden ser negativas." };
  }
  if (installmentsPaid > installmentsTotal) {
    return { error: "Las cuotas pagadas no pueden superar el total." };
  }
  if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) {
    return { error: "El día de pago debe estar entre 1 y 31." };
  }
  if (!form.start_date) return { error: "Indica la fecha de la primera cuota." };
  if (form.purpose === "favor" && !form.beneficiary_name.trim()) {
    return { error: "Indica para quién es el favor." };
  }
  if (form.purpose === "shared" && !form.beneficiary_name.trim()) {
    return { error: "Indica con quién compartes el pago." };
  }
  if (!form.category) return { error: "Selecciona una categoría." };

  const myInstallmentAmount =
    form.purpose === "shared"
      ? parseFloat(form.my_installment_amount)
      : installmentAmount;

  if (form.purpose === "shared") {
    if (isNaN(myInstallmentAmount) || myInstallmentAmount <= 0) {
      return { error: "Indica tu parte de la cuota." };
    }
    if (myInstallmentAmount > installmentAmount) {
      return { error: "Tu parte no puede superar la cuota total." };
    }
  }

  const needsReimbursement = form.purpose === "favor" || form.purpose === "shared";
  const defaultReimbursement =
    form.purpose === "favor"
      ? totalAmount
      : form.purpose === "shared"
        ? partnerShareTotal(
            installmentAmount,
            myInstallmentAmount,
            installmentsTotal
          )
        : null;

  const reimbursementStatus: ReimbursementStatus = needsReimbursement
    ? installmentsPaid >= installmentsTotal
      ? "settled"
      : "pending"
    : "none";

  return {
    error: null as string | null,
    payload: {
      title: form.title.trim(),
      provider: form.provider,
      purpose: form.purpose,
      beneficiary_name:
        form.purpose === "personal" ? null : form.beneficiary_name.trim(),
      total_amount: totalAmount,
      installment_amount: installmentAmount,
      installments_total: installmentsTotal,
      installments_paid: installmentsPaid,
      payment_day: paymentDay,
      start_date: form.start_date,
      reimbursement_amount: needsReimbursement
        ? reimbursementAmount ?? defaultReimbursement
        : null,
      reimbursement_status: reimbursementStatus,
      my_installment_amount:
        form.purpose === "shared" ? myInstallmentAmount : installmentAmount,
      category: form.category,
      notes: form.notes.trim() || null,
      is_active: installmentsPaid < installmentsTotal,
    },
  };
}

function partnerShareTotal(
  installmentAmount: number,
  myInstallmentAmount: number,
  installmentsTotal: number
): number {
  return (installmentAmount - myInstallmentAmount) * installmentsTotal;
}

export function useInstallments() {
  const router = useRouter();
  const [items, setItems] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("installment_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as InstallmentPlan[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchInstallments();
  }, [fetchInstallments]);

  async function createInstallment(form: InstallmentFormData) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const parsed = parseInstallmentForm(form);
    if (parsed.error || !parsed.payload) return { error: parsed.error };

    const { error: insertError } = await supabase
      .from("installment_plans")
      .insert({
        user_id: user.id,
        ...parsed.payload,
      });

    if (insertError) return { error: insertError.message };

    const now = new Date();
    await applyInstallmentsForMonth(
      supabase,
      user.id,
      now.getMonth() + 1,
      now.getFullYear()
    );

    await fetchInstallments();
    router.refresh();
    return { error: null };
  }

  async function updateInstallment(id: string, form: InstallmentFormData) {
    const supabase = createClient();
    const parsed = parseInstallmentForm(form);
    if (parsed.error || !parsed.payload) return { error: parsed.error };

    const { error: updateError } = await supabase
      .from("installment_plans")
      .update(parsed.payload)
      .eq("id", id);

    if (updateError) return { error: updateError.message };

    await fetchInstallments();
    router.refresh();
    return { error: null };
  }

  async function deleteInstallment(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("installment_plans")
      .delete()
      .eq("id", id);

    if (deleteError) return { error: deleteError.message };

    await fetchInstallments();
    router.refresh();
    return { error: null };
  }

  async function recordReimbursement(
    id: string,
    amount: number,
    markSettled: boolean
  ) {
    const supabase = createClient();
    const plan = items.find((item) => item.id === id);
    if (!plan) return { error: "No encontrado" };

    const reimbursed = markSettled
      ? Number(plan.reimbursement_amount ?? 0)
      : Number(plan.reimbursed_amount) + amount;

    const target = Number(plan.reimbursement_amount ?? 0);
    let status: ReimbursementStatus = "pending";
    if (markSettled || reimbursed >= target) status = "settled";
    else if (reimbursed > 0) status = "partial";

    const { error: updateError } = await supabase
      .from("installment_plans")
      .update({
        reimbursed_amount: markSettled ? target : reimbursed,
        reimbursement_status: status,
      })
      .eq("id", id);

    if (updateError) return { error: updateError.message };

    await fetchInstallments();
    router.refresh();
    return { error: null };
  }

  async function applyForMonth(month: number, year: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado", created: 0 };

    const created = await applyInstallmentsForMonth(
      supabase,
      user.id,
      month,
      year
    );
    await fetchInstallments();
    router.refresh();
    return { error: null, created };
  }

  return {
    items,
    loading,
    error,
    fetchInstallments,
    createInstallment,
    updateInstallment,
    deleteInstallment,
    recordReimbursement,
    applyForMonth,
  };
}
