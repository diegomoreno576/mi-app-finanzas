"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTodayLocal } from "@/lib/dashboard";
import type { Category, Transaction, TransactionFormData } from "@/types";

interface TransactionFormProps {
  categories: Category[];
  initial?: Transaction;
  onSubmit: (data: TransactionFormData) => Promise<{ error: string | null }>;
  onCancel: () => void;
}

function toFormData(tx?: Transaction): TransactionFormData {
  if (!tx) {
    const today = getTodayLocal();
    return {
      amount: "",
      type: "expense",
      category: "",
      description: "",
      date: today,
    };
  }
  return {
    amount: String(tx.amount),
    type: tx.type,
    category: tx.category,
    description: tx.description ?? "",
    date: tx.date,
  };
}

export function TransactionForm({
  categories,
  initial,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [form, setForm] = useState<TransactionFormData>(() => toFormData(initial));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(toFormData(initial));
    setError(null);
  }, [initial]);

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

    if (result.error) {
      setError(result.error);
      return;
    }
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
          <Label htmlFor="amount">Importe (€)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            id="type"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as TransactionFormData["type"],
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
        <Label htmlFor="category">Categoría</Label>
        <Select
          id="category"
          required
          value={form.category}
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
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Ej: Compra supermercado"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? "Guardar" : "Añadir"}
        </Button>
      </div>
    </form>
  );
}
