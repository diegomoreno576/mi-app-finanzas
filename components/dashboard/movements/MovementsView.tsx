"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteTransactionWithSources } from "@/lib/transactions/delete-linked";
import {
  calculateMonthlySummary,
  getCurrentMonthYear,
  getTodayLocal,
  toLocalDateString,
} from "@/lib/dashboard";
import { useCategories } from "@/lib/hooks/useCategories";
import { useSelectedMonth } from "@/lib/hooks/useSelectedMonth";
import { formatCurrency, formatDate, getMonthName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransactionForm } from "@/components/dashboard/transactions/TransactionForm";
import type { Transaction, TransactionFormData } from "@/types";

interface MovementsViewProps {
  transactions: Transaction[];
}

function defaultDateForSelectedMonth(month: number, year: number): string {
  const now = getCurrentMonthYear();
  if (month === now.month && year === now.year) {
    return getTodayLocal();
  }
  return toLocalDateString(new Date(year, month - 1, 1));
}

export function MovementsView({ transactions }: MovementsViewProps) {
  const router = useRouter();
  const { categories } = useCategories();
  const { month, year } = useSelectedMonth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const defaultDate = defaultDateForSelectedMonth(month, year);
  const monthLabel = getMonthName(month, year);
  const totals = useMemo(
    () => calculateMonthlySummary(transactions),
    [transactions]
  );

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Movimientos</h1>
          <p className="text-slate-400">
            Gastos e ingresos puntuales · {monthLabel}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Añadir movimiento
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-emerald-500/20 bg-emerald-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Ingresos</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">
              {formatCurrency(totals.income)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Gastos</p>
            <p className="mt-1 text-xl font-bold text-red-400">
              {formatCurrency(totals.expense)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-600/40">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">
              Balance · {transactions.length} movimiento
              {transactions.length === 1 ? "" : "s"}
            </p>
            <p
              className={`mt-1 text-xl font-bold ${
                totals.balance >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatCurrency(totals.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {transactions.length === 0 ? (
            <EmptyState
              title="Sin movimientos este mes"
              description="Registra un gasto o ingreso puntual (luz, compra, regalo…)"
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
        </CardContent>
      </Card>

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
    </div>
  );
}
