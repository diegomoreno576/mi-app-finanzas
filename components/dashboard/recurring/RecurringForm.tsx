"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category, RecurringFormData, RecurringTransaction } from "@/types";

interface RecurringFormProps {
  categories: Category[];
  initial?: RecurringTransaction;
  defaults?: Partial<RecurringFormData>;
  lockType?: boolean;
  lockCategory?: boolean;
  descriptionPlaceholder?: string;
  onSubmit: (data: RecurringFormData) => Promise<{ error: string | null }>;
  onCancel: () => void;
}

function toFormData(
  item?: RecurringTransaction,
  defaults?: Partial<RecurringFormData>
): RecurringFormData {
  if (item) {
    return {
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      description: item.description ?? "",
      day_of_month: String(item.day_of_month),
    };
  }
  return {
    amount: defaults?.amount ?? "",
    type: defaults?.type ?? "expense",
    category: defaults?.category ?? "",
    description: defaults?.description ?? "",
    day_of_month: defaults?.day_of_month ?? "1",
  };
}

export function RecurringForm({
  categories,
  initial,
  defaults,
  lockType = false,
  lockCategory = false,
  descriptionPlaceholder = "Ej: Alquiler, Nómina, Supermercado...",
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const [form, setForm] = useState<RecurringFormData>(() =>
    toFormData(initial, defaults)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.category) {
      setError("Selecciona una categoría.");
      return;
    }

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recurring-amount">Importe (€)</Label>
          <Input
            id="recurring-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recurring-type">Tipo</Label>
          <Select
            id="recurring-type"
            value={form.type}
            disabled={lockType}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as RecurringFormData["type"],
                category: "",
              })
            }
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="recurring-category">Categoría</Label>
        <Select
          id="recurring-category"
          required
          value={form.category}
          disabled={lockCategory}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="recurring-day">Día del mes</Label>
        <Input
          id="recurring-day"
          type="number"
          min="1"
          max="31"
          required
          value={form.day_of_month}
          onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
        />
        <p className="text-xs text-slate-500">
          Si el mes tiene menos días (ej. febrero), se usa el último día disponible.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="recurring-description">Descripción</Label>
        <Textarea
          id="recurring-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={descriptionPlaceholder}
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
