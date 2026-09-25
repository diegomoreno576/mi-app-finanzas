"use client";

import { useMemo, useState } from "react";
import { HelpCircle, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  DECISION_SCENARIOS,
  evaluateAffordability,
  getScenarioById,
  type AffordabilitySnapshot,
  type AffordabilityVerdict,
  type DecisionScenarioId,
} from "@/lib/affordability";
import { formatCurrency } from "@/lib/format";
import { BUCKET_LABELS } from "@/lib/financial-health";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryBucket } from "@/types";
import Link from "next/link";

interface DecisionsViewProps {
  snapshot: AffordabilitySnapshot;
}

const VERDICT_STYLE: Record<
  AffordabilityVerdict,
  { box: string; text: string; Icon: typeof CheckCircle2 }
> = {
  comfortable: {
    box: "border-emerald-500/40 bg-emerald-500/10",
    text: "text-emerald-300",
    Icon: CheckCircle2,
  },
  tight: {
    box: "border-sky-500/40 bg-sky-500/10",
    text: "text-sky-300",
    Icon: HelpCircle,
  },
  stretch: {
    box: "border-amber-500/40 bg-amber-500/10",
    text: "text-amber-200",
    Icon: AlertTriangle,
  },
  no: {
    box: "border-red-500/40 bg-red-500/10",
    text: "text-red-300",
    Icon: XCircle,
  },
};

function Metric({
  label,
  before,
  after,
  format = "currency",
}: {
  label: string;
  before: number;
  after: number;
  format?: "currency" | "percent";
}) {
  const worse = after < before;
  const fmt = (n: number) =>
    format === "percent" ? `${Math.round(n)}%` : formatCurrency(n);
  return (
    <div className="rounded-lg bg-slate-900/40 px-3 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-300">
        {fmt(before)}
        <span className="mx-1 text-slate-600">→</span>
        <span className={worse ? "text-amber-300" : "text-emerald-400"}>
          {fmt(after)}
        </span>
      </p>
    </div>
  );
}

export function DecisionsView({ snapshot }: DecisionsViewProps) {
  const [scenarioId, setScenarioId] = useState<DecisionScenarioId>("car");
  const scenario = getScenarioById(scenarioId);
  const [amount, setAmount] = useState(String(scenario.exampleAmount));
  const [bucket, setBucket] = useState<CategoryBucket>(scenario.defaultBucket);

  const evaluation = useMemo(() => {
    const parsed = parseFloat(amount);
    return evaluateAffordability(
      snapshot,
      Number.isFinite(parsed) ? parsed : 0,
      bucket
    );
  }, [snapshot, amount, bucket]);

  const style = VERDICT_STYLE[evaluation.verdict];
  const VerdictIcon = style.Icon;

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 px-4 py-3 text-sm text-slate-300">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
        <p>
          Orientación con tus datos de {snapshot.monthLabel}: ingresos/gastos del
          mes, fijos mensuales y cuotas a plazos. No es asesoramiento financiero.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>¿Qué estás valorando?</CardTitle>
          <p className="text-sm font-normal text-slate-400">
            Elige un tipo de gasto fijo y la cuota mensual aproximada.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {DECISION_SCENARIOS.map((s) => {
              const active = s.id === scenarioId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setScenarioId(s.id);
                    setBucket(s.defaultBucket);
                    setAmount(String(s.exampleAmount));
                  }}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-violet-500/60 bg-violet-600/15 ring-1 ring-violet-500/40"
                      : "border-slate-700/50 bg-slate-900/30 hover:border-slate-600"
                  }`}
                >
                  <p className="font-medium text-white">{s.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {s.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Cuota mensual (€)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {evaluation.maxSuggestedMonthly > 0 && (
                <button
                  type="button"
                  className="text-xs text-violet-400 hover:text-violet-300"
                  onClick={() =>
                    setAmount(String(evaluation.maxSuggestedMonthly))
                  }
                >
                  Usar máximo orientativo (~
                  {formatCurrency(evaluation.maxSuggestedMonthly)}/mes)
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo de gasto (50/30/20)</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["needs", BUCKET_LABELS.needs],
                    ["wants", BUCKET_LABELS.wants],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={bucket === id ? "primary" : "secondary"}
                    onClick={() => setBucket(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu situación actual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-900/40 px-3 py-3">
              <p className="text-xs text-slate-400">Ingresos del mes</p>
              <p className="text-lg font-semibold text-emerald-400">
                {formatCurrency(snapshot.income)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/40 px-3 py-3">
              <p className="text-xs text-slate-400">Gastos del mes</p>
              <p className="text-lg font-semibold text-red-300">
                {formatCurrency(snapshot.expense)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/40 px-3 py-3">
              <p className="text-xs text-slate-400">Balance del mes</p>
              <p
                className={`text-lg font-semibold ${
                  snapshot.monthBalance >= 0 ? "text-violet-300" : "text-red-400"
                }`}
              >
                {formatCurrency(snapshot.monthBalance)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/40 px-3 py-3">
              <p className="text-xs text-slate-400">Tras fijos + plazos</p>
              <p
                className={`text-lg font-semibold ${
                  snapshot.projectedBalance >= 0
                    ? "text-sky-300"
                    : "text-red-400"
                }`}
              >
                {formatCurrency(snapshot.projectedBalance)}
              </p>
            </div>
            <div className="sm:col-span-2 text-xs text-slate-500">
              Compromisos: fijos {formatCurrency(snapshot.fixedExpenseCommitment)}{" "}
              + plazos {formatCurrency(snapshot.installmentMonthly)} · Ingresos
              fijos {formatCurrency(snapshot.incomeCommitment)} · Ahorro actual ~
              {snapshot.health.savingsRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veredicto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex gap-3 rounded-xl border px-4 py-3 ${style.box}`}>
              <VerdictIcon className={`mt-0.5 h-5 w-5 shrink-0 ${style.text}`} />
              <div>
                <p className={`font-semibold ${style.text}`}>
                  {evaluation.verdictLabel}
                </p>
                <p className="mt-1 text-sm text-slate-200">{evaluation.summary}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Metric
                label="Balance del mes"
                before={snapshot.monthBalance}
                after={evaluation.afterMonthBalance}
              />
              <Metric
                label="Tras fijos + plazos"
                before={snapshot.projectedBalance}
                after={evaluation.afterProjectedBalance}
              />
              <Metric
                label="Tasa de ahorro"
                before={snapshot.health.savingsRate}
                after={evaluation.healthAfter.savingsRate}
                format="percent"
              />
              <div className="rounded-lg bg-slate-900/40 px-3 py-3">
                <p className="text-xs text-slate-400">Salud 50/30/20</p>
                <p className="mt-1 text-sm text-slate-300">
                  {snapshot.health.levelLabel}
                  <span className="mx-1 text-slate-600">→</span>
                  {evaluation.healthAfter.levelLabel}
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 text-sm text-slate-400">
              {evaluation.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-slate-600">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-slate-500">
              Si encaja, puedes registrarlo en{" "}
              <Link
                href="/dashboard/recurring"
                className="text-violet-400 hover:text-violet-300"
              >
                Fijos mensuales
              </Link>{" "}
              o en{" "}
              <Link
                href="/dashboard/installments"
                className="text-violet-400 hover:text-violet-300"
              >
                Plazos
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
