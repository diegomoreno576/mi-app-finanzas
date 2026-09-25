"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteTransactionWithSources } from "@/lib/transactions/delete-linked";
import { getCurrentMonthYear, getTodayLocal, toLocalDateString } from "@/lib/dashboard";
import { useCategories } from "@/lib/hooks/useCategories";
import { useSelectedMonth } from "@/lib/hooks/useSelectedMonth";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransactionForm } from "@/components/dashboard/transactions/TransactionForm";
import type { Transaction, TransactionFormData } from "@/types";

interface RecentTransactionsInteractiveProps {
  transactions: Transaction[];
}

function defaultDateForSelectedMonth(month: number, year: number): string {
  const now = getCurrentMonthYear();
  if (month === now.month && year === now.year) {
    return getTodayLocal();
  }
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(now.month === month && now.year === year ? new Date().getDate() : 1, lastDay);
  return toLocalDateString(new Date(year, month - 1, day));
}

export function RecentTransactionsInteractive({
  transactions,
}: RecentTransactionsInteractiveProps) {
  const router = useRouter();
  const { categories } = useCategories();
  const { month, year } = useSelectedMonth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const defaultDate = defaultDateForSelectedMonth(month, year);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function createTransaction(data: TransactionFormData) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { error: "El importe debe ser mayor que 0" };
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount,
      type: data.type,
      category: data.category,
      description: data.description || null,
      date: data.date,
    });

    if (error) return { error: error.message };

    router.refresh();
    return { error: null };
  }

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

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleting(false);
      return;
    }

    const result = await deleteTransactionWithSources(
      supabase,
      user.id,
      deleteTarget.id
    );
    setDeleting(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Añadir movimiento
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No hay transacciones"
          description="Añade un gasto o ingreso puntual (luz, compra, regalo…) con el botón de arriba"
        />
      ) : (
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
                    onClick={() => setDeleteTarget(tx)}
                    disabled={deleting && deleteTarget?.id === tx.id}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar movimiento" : "Nuevo movimiento"}
      >
        <TransactionForm
          key={editing?.id ?? `new-${defaultDate}`}
          categories={categories}
          initial={editing ?? undefined}
          defaultDate={defaultDate}
          onCancel={closeModal}
          onSubmit={async (data) => {
            const result = editing
              ? await saveTransaction(editing.id, data)
              : await createTransaction(data);
            if (!result.error) closeModal();
            return result;
          }}
        />
      </Modal>

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar movimiento"
        description="Se borrará del historial y afectará al balance del mes."
        itemName={
          deleteTarget
            ? `${deleteTarget.description || deleteTarget.category} · ${formatCurrency(Number(deleteTarget.amount))}`
            : undefined
        }
        loading={deleting}
      />
    </>
  );
}
