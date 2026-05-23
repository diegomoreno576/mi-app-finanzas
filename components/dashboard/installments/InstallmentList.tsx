"use client";

import { Pencil, Trash2, HandCoins } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getNextInstallment,
  myInstallmentAmount,
  providerLabel,
  remainingAmount,
  reimbursementPending,
} from "@/lib/installments/helpers";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { InstallmentPlan } from "@/types";

interface InstallmentListProps {
  list: InstallmentPlan[];
  onEdit: (item: InstallmentPlan) => void;
  onDelete: (id: string) => void;
  onMarkReimbursed: (id: string) => void;
}

export function InstallmentList({
  list,
  onEdit,
  onDelete,
  onMarkReimbursed,
}: InstallmentListProps) {
  if (list.length === 0) return null;

  return (
    <ul className="divide-y divide-slate-700/50">
      {list.map((item) => {
        const next = getNextInstallment(item);
        const pending = reimbursementPending(item);
        const remaining = remainingAmount(item);
        const complete = item.installments_paid >= item.installments_total;

        return (
          <li
            key={item.id}
            className={`flex flex-col gap-4 py-4 first:pt-0 last:pb-0 ${
              !item.is_active && complete ? "opacity-70" : ""
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <span className="rounded-full bg-slate-700/80 px-2 py-0.5 text-xs text-slate-300">
                    {providerLabel(item.provider)}
                  </span>
                  {item.purpose === "favor" && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                      Favor · {item.beneficiary_name}
                    </span>
                  )}
                  {item.purpose === "shared" && (
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                      Compartido · {item.beneficiary_name}
                    </span>
                  )}
                  {complete && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      Finalizado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Total {formatCurrency(Number(item.total_amount))} ·{" "}
                  {formatCurrency(myInstallmentAmount(item))}/mes
                  {item.purpose === "shared" &&
                    Number(item.installment_amount) !==
                      myInstallmentAmount(item) && (
                      <>
                        {" "}
                        (cuota total{" "}
                        {formatCurrency(Number(item.installment_amount))})
                      </>
                    )}
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      Cuotas {item.installments_paid}/{item.installments_total}
                    </span>
                    <span>
                      {item.purpose === "shared" ? "Te queda" : "Quedan"}{" "}
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                  <Progress
                    value={item.installments_paid}
                    max={item.installments_total}
                    indicatorClassName="bg-violet-500"
                  />
                </div>
                {next && !complete && (
                  <p className="mt-2 text-sm text-violet-300">
                    Próxima cuota: {formatDate(next.date)} ({next.number}/
                    {item.installments_total})
                  </p>
                )}
                {pending > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-300">
                    <HandCoins className="h-4 w-4 shrink-0" />
                    {item.beneficiary_name} te debe {formatCurrency(pending)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                {pending > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onMarkReimbursed(item.id)}
                  >
                    Marcar cobrado
                  </Button>
                )}
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("¿Eliminar este plan a plazos?")) {
                        onDelete(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
