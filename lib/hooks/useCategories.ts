"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryFormData, CategoryType } from "@/types";

export function useCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
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
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function createCategory(form: CategoryFormData) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error: insertError } = await supabase.from("categories").insert({
      user_id: user.id,
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
      type: form.type,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "Ya existe una categoría con ese nombre." };
      }
      return { error: insertError.message };
    }

    await fetchCategories();
    router.refresh();
    return { error: null };
  }

  async function updateCategory(id: string, form: CategoryFormData) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("categories")
      .update({
        name: form.name.trim(),
        color: form.color,
        icon: form.icon,
        type: form.type,
      })
      .eq("id", id);

    if (updateError) {
      if (updateError.code === "23505") {
        return { error: "Ya existe una categoría con ese nombre." };
      }
      return { error: updateError.message };
    }

    await fetchCategories();
    router.refresh();
    return { error: null };
  }

  async function deleteCategory(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) return { error: deleteError.message };

    await fetchCategories();
    router.refresh();
    return { error: null };
  }

  function getByType(type: CategoryType) {
    return categories.filter((c) => c.type === type);
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getByType,
  };
}
