"use client";

import { CreditCard, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  filterSubscriptions,
  subscriptionMonthlyTotal,
} from "@/lib/recurring/subscriptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecurringList } from "@/components/dashboard/recurring/RecurringList";
import type { RecurringTransaction } from "@/types";

interface SubscriptionsSectionProps {
  items: RecurringTransaction[];
  onAdd: () => void;
  onEdit: (item: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export function SubscriptionsSection({
  items,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
}: SubscriptionsSectionProps) {
  const subscriptions = filterSubscriptions(items);
  const monthlyTotal = subscriptionMonthlyTotal(items);

  return (
    <Card className="border-indigo-500/30 bg-indigo-600/10">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30">
              <CreditCard className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-indigo-200">Suscripciones</p>
              <p className="text-sm text-slate-400">
                Netflix, Spotify, gym… se registran solas cada mes.
              </p>
              {subscriptions.length > 0 && (
                <p className="mt-1 text-sm text-slate-500">
                  Total activas:{" "}
                  <span className="font-semibold text-indigo-300">
                    {formatCurrency(monthlyTotal)}/mes
                  </span>
                </p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4" />
            Añadir suscripción
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no tienes suscripciones. Añade cada servicio una vez y olvídate
            del resto del mes.
          </p>
        ) : (
          <RecurringList
            list={subscriptions}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        )}
      </CardContent>
    </Card>
  );
}
