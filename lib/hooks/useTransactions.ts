"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMonthBounds, shouldAutoApplyMonth } from "@/lib/dashboard";
import { applyRecurringForMonth } from "@/lib/recurring/apply";
import { applyInstallmentsForMonth } from "@/lib/installments/apply";
import type { Transaction, TransactionFormData, TransactionType } from "@/types";

const PAGE_SIZE = 10;

export interface TransactionFilterState {
  month: number;
  year: number;
  type: TransactionType | "";
  category: string;
  page: number;
}

export function useTransactions(initialFilters?: Partial<TransactionFilterState>) {
  const router = useRouter();
  const now = new Date();
  const [filters, setFilters] = useState<TransactionFilterState>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    type: "",
    category: "",
    page: 1,
    ...initialFilters,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
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

    if (shouldAutoApplyMonth(filters.month, filters.year)) {
      await applyRecurringForMonth(
        supabase,
        user.id,
        filters.month,
        filters.year
      );
      await applyInstallmentsForMonth(
        supabase,
        user.id,
        filters.month,
        filters.year
      );
    }

    const { start, end } = getMonthBounds(filters.year, filters.month);
    const from = (filters.page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    const { data, count, error: fetchError } = await query.range(from, to);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setTransactions((data ?? []) as Transaction[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function createTransaction(form: TransactionFormData) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      return { error: "El importe debe ser mayor que 0" };
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount,
      type: form.type,
      category: form.category,
      description: form.description || null,
      date: form.date,
    });

    if (insertError) return { error: insertError.message };

    await fetchTransactions();
    router.refresh();
    return { error: null };
  }

  async function updateTransaction(id: string, form: TransactionFormData) {
    const supabase = createClient();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      return { error: "El importe debe ser mayor que 0" };
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        amount,
        type: form.type,
        category: form.category,
        description: form.description || null,
        date: form.date,
      })
      .eq("id", id);

    if (updateError) return { error: updateError.message };

    await fetchTransactions();
    router.refresh();
    return { error: null };
  }

  async function deleteTransaction(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) return { error: deleteError.message };

    await fetchTransactions();
    router.refresh();
    return { error: null };
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
