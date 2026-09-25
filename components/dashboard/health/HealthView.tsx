import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  HEALTH_LEVEL_COLORS,
  type FinancialHealthResult,
  type HealthCategorySlice,
} from "@/lib/financial-health";
import { formatCurrency } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { HealthCategoryPie } from "@/components/dashboard/health/HealthCategoryPie";
import { Lightbulb } from "lucide-react";
import type { CategoryBucket } from "@/types";

const BUCKET_ORDER: CategoryBucket[] = ["needs", "wants", "savings"];

interface HealthViewProps {
  health: FinancialHealthResult;
  monthLabel: string;
  categoryBreakdown: HealthCategorySlice[];
}

export function HealthView({
  health,
  monthLabel,
  categoryBreakdown,
}: HealthViewProps) {
  if (health.income <= 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="Sin ingresos este mes"
            description={`Registra ingresos en ${monthLabel} para calcular tu salud 50/30/20.`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-400">
              Score de salud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-5xl font-bold tracking-tight ${HEALTH_LEVEL_COLORS[health.level]}`}
            >
              {health.score}
            </p>
            <p className={`mt-1 text-lg font-semibold ${HEALTH_LEVEL_COLORS[health.level]}`}>
              {health.levelLabel}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Qué tan cerca estás del 50 / 30 / 20 en {monthLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-400">
              Resumen del mes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Ingresos</span>
              <span className="font-medium text-emerald-400">
                {formatCurrency(health.income)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gastos</span>
              <span className="font-medium text-red-400">
                {formatCurrency(health.expense)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-700/50 pt-2">
              <span className="text-slate-400">Balance</span>
              <span
                className={`font-medium ${
                  health.balance >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(health.balance)}
              </span>
            </div>
            {health.inDeficit && (
              <p className="pt-1 text-xs text-red-400">
                Déficit: estás gastando más de lo que entra.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regla 50 / 30 / 20</CardTitle>
          <p className="text-sm text-slate-400">
            Cómo se reparte tu ingreso frente al objetivo
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {BUCKET_ORDER.map((bucket) => {
            const actual = health.percents[bucket];
            const target = health.targets[bucket];
            const amount = health.amounts[bucket];
            const colors = BUCKET_COLORS[bucket];

            return (
              <div key={bucket} className="space-y-2">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className={`font-medium ${colors.text}`}>
                      {BUCKET_LABELS[bucket]}
                    </p>
                    <p className="text-xs text-slate-500">
                      Objetivo {target}% · {formatCurrency(amount)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {actual}%
                    <span className="ml-1 font-normal text-slate-500">
                      / {target}%
                    </span>
                  </p>
                </div>
                <div className="relative">
                  <Progress
                    value={actual}
                    max={100}
                    className="h-2.5"
                    indicatorClassName={colors.bar}
                  />
                  <div
                    className="pointer-events-none absolute top-0 h-2.5 w-px bg-white/70"
                    style={{ left: `${target}%` }}
                    title={`Objetivo ${target}%`}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-slate-500">{health.secondaryNote}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desglose por categoría</CardTitle>
          <p className="text-sm text-slate-400">
            Qué hay dentro de necesidades, deseos y ahorro este mes
          </p>
        </CardHeader>
        <CardContent>
          <HealthCategoryPie data={categoryBreakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            Sugerencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {health.tips.map((tip) => (
              <li
                key={tip}
                className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-sm text-slate-300"
              >
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
