"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { RecurringTransaction } from "@/types";

interface RecurringListProps {
  list: RecurringTransaction[];
  onEdit: (item: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export function RecurringList({
  list,
  onEdit,
  onDelete,
  onToggleActive,
}: RecurringListProps) {
  if (list.length === 0) return null;

  return (
    <ul className="divide-y divide-slate-700/50">
      {list.map((item) => (
        <li
          key={item.id}
          className={`flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between ${
            !item.is_active ? "opacity-50" : ""
          }`}
        >
          <div>
            <p className="font-medium text-slate-100">
              {item.description || item.category}
            </p>
            <p className="text-sm text-slate-500">
              {item.category} · día {item.day_of_month} de cada mes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p
              className={`font-bold ${
                item.type === "income" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {item.type === "income" ? "+" : "-"}
              {formatCurrency(Number(item.amount))}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={item.is_active}
                onChange={(e) => onToggleActive(item.id, e.target.checked)}
                className="rounded border-slate-600"
              />
              Activo
            </label>
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
