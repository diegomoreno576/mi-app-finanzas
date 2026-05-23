"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INSTALLMENT_PROVIDERS, INSTALLMENT_PURPOSES } from "@/lib/installments/helpers";
import type {
  Category,
  InstallmentFormData,
  InstallmentPlan,
  InstallmentProvider,
  InstallmentPurpose,
} from "@/types";

interface InstallmentFormProps {
  categories: Category[];
  initial?: InstallmentPlan;
  onSubmit: (data: InstallmentFormData) => Promise<{ error: string | null }>;
  onCancel: () => void;
}

function toFormData(item?: InstallmentPlan): InstallmentFormData {
  if (!item) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      title: "",
      provider: "amazon",
      purpose: "personal",
      beneficiary_name: "",
      total_amount: "",
      installment_amount: "",
      installments_total: "3",
      installments_paid: "0",
      payment_day: String(new Date().getDate()),
      start_date: today,
      reimbursement_amount: "",
      my_installment_amount: "",
      category: "Otros",
      notes: "",
    };
  }

  return {
    title: item.title,
    provider: item.provider,
    purpose: item.purpose,
    beneficiary_name: item.beneficiary_name ?? "",
    total_amount: String(item.total_amount),
    installment_amount: String(item.installment_amount),
    installments_total: String(item.installments_total),
    installments_paid: String(item.installments_paid),
    payment_day: String(item.payment_day),
    start_date: item.start_date,
    reimbursement_amount: item.reimbursement_amount
      ? String(item.reimbursement_amount)
      : "",
    my_installment_amount: item.my_installment_amount
      ? String(item.my_installment_amount)
      : String(item.installment_amount),
    category: item.category,
    notes: item.notes ?? "",
  };
}

export function InstallmentForm({
  categories,
  initial,
  onSubmit,
  onCancel,
}: InstallmentFormProps) {
  const [form, setForm] = useState<InstallmentFormData>(() => toFormData(initial));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const isShared = form.purpose === "shared";
  const needsPartner = form.purpose === "favor" || isShared;

  function partnerShareTotalFromForm(
    data: InstallmentFormData,
    myShare: number
  ): number {
    const installment = parseFloat(data.installment_amount);
    const count = parseInt(data.installments_total, 10);
    if (isNaN(installment) || isNaN(count)) return 0;
    return (installment - myShare) * count;
  }

  function updateField<K extends keyof InstallmentFormData>(
    key: K,
    value: InstallmentFormData[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "total_amount" || key === "installments_total") {
        const total = parseFloat(
          key === "total_amount" ? String(value) : prev.total_amount
        );
        const count = parseInt(
          key === "installments_total" ? String(value) : prev.installments_total,
          10
        );
        if (!isNaN(total) && total > 0 && !isNaN(count) && count > 0) {
          next.installment_amount = (total / count).toFixed(2);
          if (next.purpose === "shared") {
            const half = (total / count / 2).toFixed(2);
            next.my_installment_amount = half;
            next.reimbursement_amount = partnerShareTotalFromForm(
              next,
              parseFloat(half)
            ).toFixed(2);
          }
        }
      }

      if (key === "installment_amount" && next.purpose === "shared") {
        const installment = parseFloat(String(value));
        if (!isNaN(installment) && installment > 0) {
          const myShare = parseFloat(next.my_installment_amount) || installment / 2;
          next.my_installment_amount = String(
            Math.min(myShare, installment).toFixed(2)
          );
          next.reimbursement_amount = partnerShareTotalFromForm(
            next,
            parseFloat(next.my_installment_amount)
          ).toFixed(2);
        }
      }

      if (key === "my_installment_amount" && next.purpose === "shared") {
        const myShare = parseFloat(String(value));
        if (!isNaN(myShare)) {
          next.reimbursement_amount = partnerShareTotalFromForm(
            next,
            myShare
          ).toFixed(2);
        }
      }

      if (key === "purpose" && value === "personal") {
        next.beneficiary_name = "";
        next.reimbursement_amount = "";
        next.my_installment_amount = "";
      }

      if (key === "purpose" && value === "favor") {
        next.my_installment_amount = "";
        if (prev.total_amount) next.reimbursement_amount = prev.total_amount;
      }

      if (key === "purpose" && value === "shared") {
        const installment = parseFloat(prev.installment_amount);
        if (!isNaN(installment) && installment > 0) {
          const half = (installment / 2).toFixed(2);
          next.my_installment_amount = half;
          next.reimbursement_amount = partnerShareTotalFromForm(
            next,
            parseFloat(half)
          ).toFixed(2);
        }
      }

      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onSubmit(form);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="installment-title">Qué compraste</Label>
        <Input
          id="installment-title"
          required
          placeholder="Ej: Portátil, regalo cumpleaños..."
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="installment-provider">Financiador</Label>
          <Select
            id="installment-provider"
            value={form.provider}
            onChange={(e) =>
              updateField("provider", e.target.value as InstallmentProvider)
            }
          >
            {(Object.keys(INSTALLMENT_PROVIDERS) as InstallmentProvider[]).map(
              (key) => (
                <option key={key} value={key}>
                  {INSTALLMENT_PROVIDERS[key]}
                </option>
              )
            )}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment-purpose">Tipo</Label>
          <Select
            id="installment-purpose"
            value={form.purpose}
            onChange={(e) =>
              updateField("purpose", e.target.value as InstallmentPurpose)
            }
          >
            <option value="personal">{INSTALLMENT_PURPOSES.personal}</option>
            <option value="favor">{INSTALLMENT_PURPOSES.favor}</option>
            <option value="shared">{INSTALLMENT_PURPOSES.shared}</option>
          </Select>
        </div>
      </div>

      {needsPartner && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="installment-beneficiary">
              {isShared ? "Con quién compartes" : "Para quién"}
            </Label>
            <Input
              id="installment-beneficiary"
              required
              placeholder="Nombre"
              value={form.beneficiary_name}
              onChange={(e) => updateField("beneficiary_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installment-reimburse">
              {isShared ? "Su parte total (€)" : "Te deben (€)"}
            </Label>
            <Input
              id="installment-reimburse"
              type="number"
              step="0.01"
              min="0"
              placeholder={
                isShared
                  ? "Lo que debe pagar la otra persona"
                  : "Importe a recuperar"
              }
              value={form.reimbursement_amount}
              onChange={(e) => updateField("reimbursement_amount", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="installment-total">Importe total (€)</Label>
          <Input
            id="installment-total"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.total_amount}
            onChange={(e) => updateField("total_amount", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment-count">Número de cuotas</Label>
          <Input
            id="installment-count"
            type="number"
            min="1"
            required
            value={form.installments_total}
            onChange={(e) => updateField("installments_total", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="installment-amount">Cuota (€)</Label>
          <Input
            id="installment-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.installment_amount}
            onChange={(e) => updateField("installment_amount", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment-paid">Cuotas pagadas</Label>
          <Input
            id="installment-paid"
            type="number"
            min="0"
            value={form.installments_paid}
            onChange={(e) => updateField("installments_paid", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment-day">Día de pago</Label>
          <Input
            id="installment-day"
            type="number"
            min="1"
            max="31"
            required
            value={form.payment_day}
            onChange={(e) => updateField("payment_day", e.target.value)}
          />
        </div>
      </div>

      {isShared && (
        <div className="space-y-2">
          <Label htmlFor="installment-my-share">Tu parte por cuota (€)</Label>
          <Input
            id="installment-my-share"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Lo que pagas tú cada mes"
            value={form.my_installment_amount}
            onChange={(e) => updateField("my_installment_amount", e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Cuota total al financiador: {form.installment_amount || "—"} €. Solo tu
            parte se registrará en Transacciones.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="installment-start">Primera cuota</Label>
          <Input
            id="installment-start"
            type="date"
            required
            value={form.start_date}
            onChange={(e) => updateField("start_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment-category">Categoría del gasto</Label>
          <Select
            id="installment-category"
            required
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
          >
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="installment-notes">Notas</Label>
        <Textarea
          id="installment-notes"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Enlace, detalles del acuerdo..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
