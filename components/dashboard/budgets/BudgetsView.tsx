"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useBudgets } from "@/lib/hooks/useBudgets";
import type { BudgetWithDetails } from "@/types";
import { formatCurrency, getMonthName } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function BudgetsView() {
  const {
    month,
    year,
    setMonth,
    setYear,
    budgets,
    expenseCategories,
    loading,
    error,
    upsertBudget,
    deleteBudget,
  } = useBudgets();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithDetails | null>(
    null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithDetails | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = expenseCategories.filter(
    (c) => !budgetedCategoryIds.has(c.id) || c.id === editingBudget?.category_id
  );

  function openCreateModal() {
    setEditingBudget(null);
    setSelectedCategoryId("");
    setAmount("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(budget: BudgetWithDetails) {
    setEditingBudget(budget);
    setSelectedCategoryId(budget.category_id);
    setAmount(String(budget.amount));
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setFormError("Introduce un importe válido.");
      return;
    }
    if (!selectedCategoryId) {
      setFormError("Selecciona una categoría.");
      return;
    }

    setSaving(true);
    const result = await upsertBudget(selectedCategoryId, parsed);
    setSaving(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setModalOpen(false);
    setEditingBudget(null);
    setSelectedCategoryId("");
    setAmount("");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteBudget(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  function getProgressColor(percent: number) {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-amber-500";
    return "bg-violet-500";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Presupuestos</h1>
          <p className="text-slate-400">
            Control de gasto por categoría · {getMonthName(month, year)}
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          disabled={
            availableCategories.filter(
              (c) => !budgetedCategoryIds.has(c.id)
            ).length === 0
          }
        >
          <Plus className="h-4 w-4" />
          Añadir presupuesto
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="min-w-[140px] flex-1 space-y-1">
            <label className="text-xs text-slate-400">Mes</label>
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m, year)}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[100px] flex-1 space-y-1">
            <label className="text-xs text-slate-400">Año</label>
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Sin presupuestos este mes"
              description="Define un presupuesto por categoría de gasto"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const limit = Number(budget.amount);
            const spent = budget.spent;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const isWarning = percent >= 80 && percent < 100;
            const isOver = percent >= 100;

            return (
              <Card key={budget.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {budget.category && (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${budget.category.color}20`,
                          }}
                        >
                          <CategoryIcon
                            name={budget.category.icon}
                            className="h-5 w-5"
                            style={{ color: budget.category.color }}
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-100">
                          {budget.category?.name ?? "Categoría"}
                        </p>
                        <p className="text-sm text-slate-400">
                          <span className="font-bold text-red-400">
                            {formatCurrency(spent)}
                          </span>
                          {" / "}
                          <span className="text-slate-300">
                            {formatCurrency(limit)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isWarning || isOver) && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            isOver
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {isOver ? "Superado" : `${Math.round(percent)}%`}
                        </span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(budget)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(budget)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(spent, limit)}
                    max={limit}
                    indicatorClassName={getProgressColor(percent)}
                  />
                  <p className="text-right text-xs text-slate-500">
                    {Math.round(percent)}% utilizado
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBudget(null);
          setFormError(null);
        }}
        title={editingBudget ? "Editar presupuesto" : "Nuevo presupuesto"}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="budget-category">Categoría</Label>
            <Select
              id="budget-category"
              required
              disabled={!!editingBudget}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Presupuesto (€)</Label>
            <Input
              id="budget-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar presupuesto"
        description="Se quitará el límite de esta categoría para el mes seleccionado."
        itemName={deleteTarget?.category?.name}
        loading={deleting}
      />
    </div>
  );
}
