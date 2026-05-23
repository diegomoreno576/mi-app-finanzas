"use client";

import { useState } from "react";
import { Briefcase, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { findMonthlySalary } from "@/lib/recurring/salary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { RecurringFormData, RecurringTransaction } from "@/types";

interface MonthlySalaryCardProps {
  items: RecurringTransaction[];
  onSave: (form: RecurringFormData) => Promise<{ error: string | null }>;
  onEdit: (item: RecurringTransaction) => void;
}

export function MonthlySalaryCard({
  items,
  onSave,
  onEdit,
}: MonthlySalaryCardProps) {
  const salary = findMonthlySalary(items);
  const [amount, setAmount] = useState(
    salary ? String(salary.amount) : ""
  );
  const [day, setDay] = useState(
    salary ? String(salary.day_of_month) : "28"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const result = await onSave({
      amount,
      type: "income",
      category: "Salario",
      description: "Nómina",
      day_of_month: day,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSaved(true);
  }

  if (salary) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-600/10">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/30">
                <Briefcase className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-200">Nómina mensual</p>
                <p className="text-sm text-slate-400">
                  Se aplica sola cada mes · día {salary.day_of_month}
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-400">
                  {formatCurrency(Number(salary.amount))}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onEdit(salary)}>
              <Pencil className="h-4 w-4" />
              Editar nómina
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Los ingresos extra (freelance, regalos, etc.) añádelos en Transacciones
            cuando ocurran.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/30 bg-emerald-600/10">
      <CardContent className="space-y-4 p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/30">
            <Briefcase className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-emerald-200">Configura tu nómina</p>
            <p className="text-sm text-slate-400">
              Una sola vez. Cada mes se registra sola; los extras los añades tú
              en Transacciones.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          {error && (
            <div className="sm:col-span-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          {saved && (
            <div className="sm:col-span-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              Nómina guardada. Se aplicará automáticamente cada mes.
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="salary-amount">Importe neto (€)</Label>
            <Input
              id="salary-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="salary-day">Día del mes</Label>
            <Input
              id="salary-day"
              type="number"
              min="1"
              max="31"
              required
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={loading} className="w-full">
              Guardar nómina
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
