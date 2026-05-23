"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/hooks/useCategories";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransactionForm } from "@/components/dashboard/transactions/TransactionForm";
import type { Transaction, TransactionFormData } from "@/types";

interface RecentTransactionsInteractiveProps {
  transactions: Transaction[];
}

export function RecentTransactionsInteractive({
  transactions,
}: RecentTransactionsInteractiveProps) {
  const router = useRouter();
  const { categories } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function saveTransaction(id: string, data: TransactionFormData) {
    const supabase = createClient();
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { error: "El importe debe ser mayor que 0" };
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        amount,
        type: data.type,
        category: data.category,
        description: data.description || null,
        date: data.date,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    router.refresh();
    return { error: null };
  }

  async function removeTransaction(id: string) {
    if (!confirm("¿Eliminar esta transacción?")) return;

    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No hay transacciones"
        description="Las últimas transacciones aparecerán aquí"
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-slate-700/50">
        {transactions.map((tx) => {
          const isIncome = tx.type === "income";
          return (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}
                >
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">
                    {tx.description || tx.category}
                  </p>
                  <p className="text-sm text-slate-500">
                    {tx.category} · {formatDate(tx.date)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p
                  className={`font-bold ${
                    isIncome ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(Number(tx.amount))}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(tx);
                    setModalOpen(true);
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTransaction(tx.id)}
                  disabled={deletingId === tx.id}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title="Editar transacción"
      >
        {editing && (
          <TransactionForm
            key={editing.id}
            categories={categories}
            initial={editing}
            onCancel={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            onSubmit={async (data) => {
              const result = await saveTransaction(editing.id, data);
              if (!result.error) {
                setModalOpen(false);
                setEditing(null);
              }
              return result;
            }}
          />
        )}
      </Modal>
    </>
  );
}
