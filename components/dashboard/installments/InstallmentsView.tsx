"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  HandCoins,
  Plus,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useInstallments } from "@/lib/hooks/useInstallments";
import { useCategories } from "@/lib/hooks/useCategories";
import { formatCurrency } from "@/lib/format";
import {
  buildMonthlyBreakdownByPerson,
  dueThisMonthTotal,
  getNextInstallment,
  monthlyPaymentTotal,
  remainingAmount,
  reimbursementPending,
} from "@/lib/installments/helpers";
import { InstallmentMonthlyBreakdown } from "@/components/dashboard/installments/InstallmentMonthlyBreakdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InstallmentForm } from "@/components/dashboard/installments/InstallmentForm";
import { InstallmentList } from "@/components/dashboard/installments/InstallmentList";
import type { InstallmentPlan, InstallmentPurpose } from "@/types";

type FilterTab = "all" | InstallmentPurpose;

export function InstallmentsView() {
  const {
    items,
    loading,
    error,
    createInstallment,
    updateInstallment,
    deleteInstallment,
    recordReimbursement,
    applyForMonth,
  } = useInstallments();
  const { categories } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InstallmentPlan | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.purpose === filter);
  }, [items, filter]);

  const activePlans = items.filter(
    (item) => item.is_active && item.installments_paid < item.installments_total
  );
  const totalRemaining = activePlans.reduce(
    (sum, item) => sum + remainingAmount(item),
    0
  );
  const favorsPending = items.reduce(
    (sum, item) => sum + reimbursementPending(item),
    0
  );
  const monthlyTotal = monthlyPaymentTotal(activePlans);
  const dueThisMonthAmount = dueThisMonthTotal(activePlans, month, year);
  const dueThisMonthCount = activePlans.filter((item) => {
    const next = getNextInstallment(item);
    return next?.month === month && next?.year === year;
  }).length;
  const monthlyBreakdown = useMemo(
    () => buildMonthlyBreakdownByPerson(items),
    [items]
  );

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
        ? `Se registraron ${result.created} cuota(s) de este mes.`
        : "No había cuotas pendientes para este mes."
    );
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: InstallmentPlan) {
    setEditing(item);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plazos y favores</h1>
          <p className="text-slate-400">
            Cofidis, Klarna, Pepper, Aplázame y más. Para ti, favores o pago
            compartido.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Añadir compra a plazos
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-red-500/30 bg-red-600/10">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600/30">
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pagas al mes</p>
              <p className="text-xl font-bold text-red-300">
                {formatCurrency(monthlyTotal)}
              </p>
              <p className="text-xs text-slate-500">
                Tu gasto a plazos (sin favores) · {activePlans.filter((i) => i.purpose !== "favor").length}{" "}
                plan
                {activePlans.filter((i) => i.purpose !== "favor").length === 1 ? "" : "es"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-500/30 bg-violet-600/10">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/30">
              <Wallet className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Deuda restante</p>
              <p className="text-xl font-bold text-violet-300">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="text-xs text-slate-500">
                {activePlans.length} activo{activePlans.length === 1 ? "" : "s"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-500/30 bg-indigo-600/10">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30">
              <CalendarClock className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Cuotas este mes</p>
              <p className="text-xl font-bold text-indigo-300">
                {dueThisMonthCount > 0
                  ? formatCurrency(dueThisMonthAmount)
                  : formatCurrency(0)}
              </p>
              <p className="text-xs text-slate-500">
                {dueThisMonthCount > 0
                  ? `${dueThisMonthCount} cuota${dueThisMonthCount === 1 ? "" : "s"} · resta del balance al aplicar`
                  : "Ninguna vence este mes"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-0 text-xs text-indigo-300"
                onClick={handleApplyMonth}
                loading={applying}
              >
                Aplicar ahora
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-600/10">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600/30">
              <HandCoins className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Te deben</p>
              <p className="text-xl font-bold text-amber-300">
                {formatCurrency(favorsPending)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <InstallmentMonthlyBreakdown breakdown={monthlyBreakdown} />

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

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["personal", "Para mí"],
            ["favor", "Favores"],
            ["shared", "Compartidos"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={filter === key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="Sin compras a plazos"
              description="Añade una financiación e indica si es para ti, un favor o pago compartido."
            />
          ) : (
            <InstallmentList
              list={filtered}
              onEdit={openEdit}
              onDelete={deleteInstallment}
              onMarkReimbursed={(id) => recordReimbursement(id, 0, true)}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar compra a plazos" : "Nueva compra a plazos"}
      >
        <InstallmentForm
          key={editing?.id ?? "new"}
          categories={categories}
          initial={editing ?? undefined}
          onCancel={closeModal}
          onSubmit={async (data) => {
            const result = editing
              ? await updateInstallment(editing.id, data)
              : await createInstallment(data);
            if (!result.error) closeModal();
            return result;
          }}
        />
      </Modal>
    </div>
  );
}
