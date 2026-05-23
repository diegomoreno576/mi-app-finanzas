"use client";

import { useState } from "react";
import { CalendarClock, Plus, Zap } from "lucide-react";
import { useRecurring } from "@/lib/hooks/useRecurring";
import { useCategories } from "@/lib/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RecurringForm } from "@/components/dashboard/recurring/RecurringForm";
import { RecurringList } from "@/components/dashboard/recurring/RecurringList";
import { MonthlySalaryCard } from "@/components/dashboard/recurring/MonthlySalaryCard";
import { SubscriptionsSection } from "@/components/dashboard/recurring/SubscriptionsSection";
import { findMonthlySalary, isSalaryRecurring } from "@/lib/recurring/salary";
import {
  isSubscriptionRecurring,
  SUBSCRIPTION_CATEGORY,
} from "@/lib/recurring/subscriptions";
import type { RecurringFormData, RecurringTransaction } from "@/types";

type ModalMode = "generic" | "subscription";

export function RecurringView() {
  const {
    items,
    loading,
    error,
    createRecurring,
    updateRecurring,
    toggleActive,
    deleteRecurring,
    applyForMonth,
  } = useRecurring();
  const { categories } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("generic");
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const expenses = items.filter((i) => i.type === "expense");
  const otherExpenses = expenses.filter((i) => !isSubscriptionRecurring(i));
  const otherIncomes = items.filter(
    (i) => i.type === "income" && !isSalaryRecurring(i)
  );

  async function saveSalary(form: RecurringFormData) {
    const existing = findMonthlySalary(items);
    if (existing) return updateRecurring(existing.id, form);
    return createRecurring(form);
  }

  async function handleApplyMonth() {
    setApplying(true);
    setApplyMessage(null);
    const result = await applyForMonth(month, year);
    setApplying(false);

    if (result.error) {
      setApplyMessage(result.error);
      return;
    }

    setApplyMessage(
      result.created > 0
        ? `Se generaron ${result.created} transacción(es) para este mes.`
        : "No había nada pendiente: ya están aplicados o no hay plantillas activas."
    );
  }

  function openCreate() {
    setEditing(null);
    setModalMode("generic");
    setModalOpen(true);
  }

  function openCreateSubscription() {
    setEditing(null);
    setModalMode("subscription");
    setModalOpen(true);
  }

  function openEdit(item: RecurringTransaction) {
    setEditing(item);
    setModalMode(isSubscriptionRecurring(item) ? "subscription" : "generic");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setModalMode("generic");
  }

  const isSubscriptionModal = modalMode === "subscription";
  const modalTitle = editing
    ? isSubscriptionModal
      ? "Editar suscripción"
      : "Editar fijo mensual"
    : isSubscriptionModal
      ? "Nueva suscripción"
      : "Nuevo fijo mensual";

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fijos mensuales</h1>
          <p className="text-slate-400">
            Nómina, suscripciones y otros gastos que se repiten. Ingresos extra →
            Transacciones.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Añadir fijo
        </Button>
      </div>

      <MonthlySalaryCard
        items={items}
        onSave={saveSalary}
        onEdit={openEdit}
      />

      <SubscriptionsSection
        items={items}
        onAdd={openCreateSubscription}
        onEdit={openEdit}
        onDelete={deleteRecurring}
        onToggleActive={toggleActive}
      />

      <Card className="border-violet-500/30 bg-violet-600/10">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/30">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-violet-200">Generación automática</p>
              <p className="text-sm text-slate-400">
                Al abrir el dashboard se aplican los fijos del mes actual. También
                puedes forzarlo aquí.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleApplyMonth}
            loading={applying}
            className="shrink-0"
          >
            <CalendarClock className="h-4 w-4" />
            Aplicar este mes
          </Button>
        </CardContent>
      </Card>

      {applyMessage && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-600/10 px-4 py-3 text-sm text-violet-200">
          {applyMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {otherExpenses.length === 0 && otherIncomes.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Sin otros fijos"
              description="Configura la nómina y suscripciones arriba. Alquiler u otros gastos con «Añadir fijo»."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {otherExpenses.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-4 font-semibold text-white">Otros gastos fijos</h2>
                <RecurringList
                  list={otherExpenses}
                  onEdit={openEdit}
                  onDelete={deleteRecurring}
                  onToggleActive={toggleActive}
                />
              </CardContent>
            </Card>
          )}
          {otherIncomes.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-4 font-semibold text-white">
                  Otros ingresos fijos
                </h2>
                <RecurringList
                  list={otherIncomes}
                  onEdit={openEdit}
                  onDelete={deleteRecurring}
                  onToggleActive={toggleActive}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={modalTitle}>
        <RecurringForm
          key={editing?.id ?? modalMode}
          categories={categories}
          initial={editing ?? undefined}
          defaults={
            isSubscriptionModal
              ? {
                  type: "expense",
                  category: SUBSCRIPTION_CATEGORY,
                  day_of_month: "1",
                }
              : undefined
          }
          lockType={isSubscriptionModal}
          lockCategory={isSubscriptionModal}
          descriptionPlaceholder={
            isSubscriptionModal
              ? "Ej: Netflix, Spotify, Gimnasio..."
              : undefined
          }
          onCancel={closeModal}
          onSubmit={async (data) => {
            const result = editing
              ? await updateRecurring(editing.id, data)
              : await createRecurring(data);
            if (!result.error) closeModal();
            return result;
          }}
        />
      </Modal>
    </div>
  );
}
