"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import { formatCurrency, formatDate, getMonthName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransactionForm } from "@/components/dashboard/transactions/TransactionForm";
import type { Transaction } from "@/types";

export function TransactionsView() {
  const {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    totalCount,
    totalPages,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function requestDelete(tx: Transaction) {
    setDeleteTarget(tx);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteTransaction(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const categoryNames = [
    ...new Set(categories.map((c) => c.name)),
  ].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transacciones</h1>
          <p className="text-slate-400">
            {getMonthName(filters.month, filters.year)} · {totalCount}{" "}
            {totalCount === 1 ? "registro" : "registros"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            La nómina, suscripciones y cuotas se registran solas en sus secciones.
            Aquí solo ingresos extra y gastos puntuales.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Añadir transacción
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Mes</label>
            <Select
              value={filters.month}
              onChange={(e) =>
                setFilters({ ...filters, month: Number(e.target.value), page: 1 })
              }
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m, filters.year)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Año</label>
            <Select
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: Number(e.target.value), page: 1 })
              }
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Tipo</label>
            <Select
              value={filters.type}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  type: e.target.value as typeof filters.type,
                  page: 1,
                })
              }
            >
              <option value="">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Categoría</label>
            <Select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value, page: 1 })
              }
              disabled={categoriesLoading}
            >
              <option value="">Todas</option>
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No hay transacciones"
              description="Ajusta los filtros o añade una nueva transacción"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left text-slate-400">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium text-right">Importe</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 text-slate-300">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 text-slate-100">
                        {tx.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tx.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            tx.type === "income"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {tx.type === "income" ? "Ingreso" : "Gasto"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(tx)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDelete(tx)}
                            disabled={deleting && deleteTarget?.id === tx.id}
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Página {filters.page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters({ ...filters, page: filters.page - 1 })
              }
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() =>
                setFilters({ ...filters, page: filters.page + 1 })
              }
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar transacción" : "Nueva transacción"}
      >
        <TransactionForm
          key={editing?.id ?? "new"}
          categories={categories}
          initial={editing ?? undefined}
          onCancel={closeModal}
          onSubmit={async (data) => {
            const result = editing
              ? await updateTransaction(editing.id, data)
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
        title="Eliminar transacción"
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
