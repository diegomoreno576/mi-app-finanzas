"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMonthBounds } from "@/lib/dashboard";
import type { Budget, BudgetWithDetails, Category } from "@/types";

export function useBudgets(initialMonth?: number, initialYear?: number) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetWithDetails[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
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

    const [{ data: budgetData, error: budgetError }, { data: catData }, { data: txData }] =
      await Promise.all([
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .eq("month", month)
          .eq("year", year),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "expense")
          .order("name"),
        (() => {
          const { start, end } = getMonthBounds(year, month);
          return supabase
            .from("transactions")
            .select("category, amount")
            .eq("user_id", user.id)
            .eq("type", "expense")
            .gte("date", start)
            .lte("date", end);
        })(),
      ]);

    if (budgetError) {
      setError(budgetError.message);
      setLoading(false);
      return;
    }

    const spentByCategory = new Map<string, number>();
    (txData ?? []).forEach((tx: { category: string; amount: number }) => {
      const current = spentByCategory.get(tx.category) ?? 0;
      spentByCategory.set(tx.category, current + Number(tx.amount));
    });

    const categories = (catData ?? []) as Category[];
    setExpenseCategories(categories);
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const enriched: BudgetWithDetails[] = ((budgetData ?? []) as Budget[]).map(
      (b) => {
        const category = catMap.get(b.category_id);
        return {
          ...b,
          category,
          spent: category ? spentByCategory.get(category.name) ?? 0 : 0,
        };
      }
    );

    setBudgets(enriched);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  async function upsertBudget(categoryId: string, amount: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    if (amount <= 0) return { error: "El presupuesto debe ser mayor que 0" };

    const existing = budgets.find((b) => b.category_id === categoryId);

    if (existing) {
      const { error: updateError } = await supabase
        .from("budgets")
        .update({ amount })
        .eq("id", existing.id);

      if (updateError) return { error: updateError.message };
    } else {
      const { error: insertError } = await supabase.from("budgets").insert({
        user_id: user.id,
        category_id: categoryId,
        amount,
        month,
        year,
      });

      if (insertError) return { error: insertError.message };
    }

    await fetchBudgets();
    router.refresh();
    return { error: null };
  }

  async function deleteBudget(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id);

    if (deleteError) return { error: deleteError.message };

    await fetchBudgets();
    router.refresh();
    return { error: null };
  }

  return {
    month,
    year,
    setMonth,
    setYear,
    budgets,
    expenseCategories,
    loading,
    error,
    fetchBudgets,
    upsertBudget,
    deleteBudget,
  };
}
