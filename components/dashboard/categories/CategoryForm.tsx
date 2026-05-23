"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "@/lib/icons";
import type { Category, CategoryFormData } from "@/types";

interface CategoryFormProps {
  initial?: Category;
  defaultType?: CategoryFormData["type"];
  onSubmit: (data: CategoryFormData) => Promise<{ error: string | null }>;
  onCancel: () => void;
}

function toFormData(
  initial?: Category,
  defaultType?: CategoryFormData["type"]
): CategoryFormData {
  if (initial) {
    return {
      name: initial.name,
      color: initial.color,
      icon: initial.icon,
      type: initial.type,
    };
  }
  return {
    name: "",
    color: "#7c3aed",
    icon: "circle",
    type: defaultType ?? "expense",
  };
}

export function CategoryForm({
  initial,
  defaultType,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [form, setForm] = useState<CategoryFormData>(
    toFormData(initial, defaultType)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
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
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      {!initial && (
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            id="type"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as CategoryFormData["type"],
              })
            }
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-10 w-14 cursor-pointer rounded border border-slate-600 bg-transparent"
          />
          <span className="text-sm text-slate-400">{form.color}</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Icono</Label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm({ ...form, icon })}
              className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                form.icon === icon
                  ? "border-violet-500 bg-violet-600/20 text-violet-400"
                  : "border-slate-600 text-slate-400 hover:border-slate-500"
              }`}
            >
              <CategoryIcon name={icon} className="h-5 w-5" />
            </button>
          ))}
        </div>
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
