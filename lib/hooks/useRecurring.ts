"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyRecurringForMonth } from "@/lib/recurring/apply";
import { deleteTransactionsForRecurring } from "@/lib/transactions/delete-linked";
import type { RecurringFormData, RecurringTransaction } from "@/types";

export function useRecurring() {
  const router = useRouter();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurring = useCallback(async () => {
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
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("day_of_month");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as RecurringTransaction[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRecurring();
  }, [fetchRecurring]);

  async function createRecurring(form: RecurringFormData) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const amount = parseFloat(form.amount);
    const day = parseInt(form.day_of_month, 10);

    if (isNaN(amount) || amount <= 0) {
      return { error: "El importe debe ser mayor que 0" };
    }
    if (isNaN(day) || day < 1 || day > 31) {
      return { error: "El día debe estar entre 1 y 31" };
    }

    const { data: existing } = await supabase
      .from("recurring_transactions")
      .select("id, type, category")
      .eq("user_id", user.id);

    const wouldBeSalary =
      form.type === "income" && form.category === "Salario";
    if (
      wouldBeSalary &&
      (existing ?? []).some(
        (r) => r.type === "income" && r.category === "Salario"
      )
    ) {
      return {
        error:
          "Ya tienes nómina configurada. Edítala en la tarjeta de arriba.",
      };
    }

    const { error: insertError } = await supabase
      .from("recurring_transactions")
      .insert({
        user_id: user.id,
        amount,
        type: form.type,
        category: form.category,
        description: form.description || null,
        day_of_month: day,
      });

    if (insertError) return { error: insertError.message };

    const now = new Date();
    await applyRecurringForMonth(
      supabase,
      user.id,
      now.getMonth() + 1,
      now.getFullYear()
    );

    await fetchRecurring();
    router.refresh();
    return { error: null };
  }

  async function updateRecurring(id: string, form: RecurringFormData) {
    const supabase = createClient();
    const amount = parseFloat(form.amount);
    const day = parseInt(form.day_of_month, 10);

    if (isNaN(amount) || amount <= 0) {
      return { error: "El importe debe ser mayor que 0" };
    }
    if (isNaN(day) || day < 1 || day > 31) {
      return { error: "El día debe estar entre 1 y 31" };
    }

    const { error: updateError } = await supabase
      .from("recurring_transactions")
      .update({
        amount,
        type: form.type,
        category: form.category,
        description: form.description || null,
        day_of_month: day,
      })
      .eq("id", id);

    if (updateError) return { error: updateError.message };

    await fetchRecurring();
    router.refresh();
    return { error: null };
  }

  async function toggleActive(id: string, isActive: boolean) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("recurring_transactions")
      .update({ is_active: isActive })
      .eq("id", id);

    if (updateError) return { error: updateError.message };

    await fetchRecurring();
    router.refresh();
    return { error: null };
  }

  async function deleteRecurring(id: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    await deleteTransactionsForRecurring(supabase, user.id, id);

    const { error: deleteError } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);

    if (deleteError) return { error: deleteError.message };

    await fetchRecurring();
    router.refresh();
    return { error: null };
  }

  async function applyForMonth(month: number, year: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado", created: 0 };

    const created = await applyRecurringForMonth(
      supabase,
      user.id,
      month,
      year
    );
    router.refresh();
    return { error: null, created };
  }

  return {
    items,
    loading,
    error,
    fetchRecurring,
    createRecurring,
    updateRecurring,
    toggleActive,
    deleteRecurring,
    applyForMonth,
  };
}
