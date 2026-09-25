"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import {
  getReferenceById,
  groupReferencesByKind,
} from "@/lib/investments/catalog";
import { projectInvestment } from "@/lib/investments/projection";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectionChart } from "@/components/dashboard/investments/ProjectionChart";

interface ReferenceApiResponse {
  referenceId: string;
  label: string;
  annualRatePercent: number;
  source: string;
  yearsUsed: number | null;
  symbol: string | null;
  message: string;
  asOf?: string;
}

interface InvestmentsViewProps {
  /** Sugerencia de aporte mensual (ej. ahorro del mes). */
  suggestedMonthly?: number;
}

export function InvestmentsView({ suggestedMonthly = 0 }: InvestmentsViewProps) {
  const [referenceId, setReferenceId] = useState("world");
  const [initialCapital, setInitialCapital] = useState("1000");
  const [monthlyContribution, setMonthlyContribution] = useState(
    suggestedMonthly > 0 ? String(Math.round(suggestedMonthly)) : "200"
  );
  const [years, setYears] = useState("10");
  const [manualRate, setManualRate] = useState("");
  const [useManualRate, setUseManualRate] = useState(false);
  const [apiRate, setApiRate] = useState<ReferenceApiResponse | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const loadRate = useCallback(async (id: string) => {
    setLoadingRate(true);
    try {
      const res = await fetch(`/api/investments/reference?referenceId=${id}`);
      if (res.ok) {
        const data = (await res.json()) as ReferenceApiResponse;
        setApiRate(data);
      } else {
        const ref = getReferenceById(id);
        setApiRate({
          referenceId: ref.id,
          label: ref.label,
          annualRatePercent: ref.presetAnnualRate,
          source: "preset",
          yearsUsed: null,
          symbol: ref.symbol,
          message: "Preset educativo.",
        });
      }
    } catch {
      const ref = getReferenceById(id);
      setApiRate({
        referenceId: ref.id,
        label: ref.label,
        annualRatePercent: ref.presetAnnualRate,
        source: "preset",
        yearsUsed: null,
        symbol: ref.symbol,
        message: "Preset educativo (sin conexión a API).",
      });
    } finally {
      setLoadingRate(false);
    }
  }, []);

  useEffect(() => {
    void loadRate(referenceId);
  }, [referenceId, loadRate]);

  const annualRate = useMemo(() => {
    if (useManualRate) {
      const parsed = parseFloat(manualRate);
      return Number.isFinite(parsed) ? parsed : 5;
    }
    return apiRate?.annualRatePercent ?? getReferenceById(referenceId).presetAnnualRate;
  }, [useManualRate, manualRate, apiRate, referenceId]);

  const projection = useMemo(() => {
    const initial = parseFloat(initialCapital) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const yrs = parseInt(years, 10) || 10;
    return projectInvestment({
      initialCapital: initial,
      monthlyContribution: monthly,
      years: yrs,
      annualRatePercent: annualRate,
    });
  }, [initialCapital, monthlyContribution, years, annualRate]);

  const selected = getReferenceById(referenceId);
  const groups = useMemo(() => groupReferencesByKind(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inversiones</h1>
        <p className="text-slate-400">
          Elige un tipo de fondo o cartera y proyecta cuánto podrías acumular
          aportando cada mes
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p>
          No es asesoramiento financiero. Las rentabilidades pasadas no garantizan
          resultados futuros. Los tickers son proxies educativos, no una
          recomendación de compra.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de fondos y carteras</CardTitle>
          <p className="text-sm font-normal text-slate-400">
            Elige una referencia educativa. Cada opción describe para qué sirve,
            el riesgo típico y la composición aproximada.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.map((group) => (
            <div key={group.kind} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.kindLabel}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((ref) => {
                  const active = ref.id === referenceId;
                  return (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => {
                        setReferenceId(ref.id);
                        setUseManualRate(false);
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-violet-500/60 bg-violet-600/15 ring-1 ring-violet-500/40"
                          : "border-slate-700/50 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-white">{ref.label}</p>
                        <span className="shrink-0 text-xs text-slate-400">
                          ~{ref.presetAnnualRate}%
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {ref.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>Riesgo: {ref.riskLabel}</span>
                        <span>·</span>
                        <span>{ref.horizon}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
            <p className="text-sm font-medium text-white">{selected.label}</p>
            <p className="mt-1 text-sm text-slate-300">{selected.description}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Para quién</dt>
                <dd className="text-sm text-slate-200">{selected.suitedFor}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Horizonte típico</dt>
                <dd className="text-sm text-slate-200">{selected.horizon}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Riesgo</dt>
                <dd className="text-sm text-slate-200">{selected.riskLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Composición aprox.</dt>
                <dd className="text-sm text-slate-200">{selected.assetMix}</dd>
              </div>
              {selected.symbol && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">
                    Proxy histórico (educativo)
                  </dt>
                  <dd className="text-sm text-slate-200">
                    Ticker {selected.symbol} — referencia aproximada, no un
                    producto recomendado para comprar.
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initial">Capital inicial (€)</Label>
                <Input
                  id="initial"
                  type="number"
                  min="0"
                  step="100"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly">Aporte mensual (€)</Label>
                <Input
                  id="monthly"
                  type="number"
                  min="0"
                  step="10"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                />
                {suggestedMonthly > 0 && (
                  <button
                    type="button"
                    className="text-xs text-violet-400 hover:text-violet-300"
                    onClick={() =>
                      setMonthlyContribution(String(Math.round(suggestedMonthly)))
                    }
                  >
                    Usar ahorro del mes (~{formatCurrency(suggestedMonthly)})
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="years">Años</Label>
                <Input
                  id="years"
                  type="number"
                  min="1"
                  max="40"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rentabilidad anual (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  value={useManualRate ? manualRate : String(annualRate)}
                  onChange={(e) => {
                    setUseManualRate(true);
                    setManualRate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
              {loadingRate ? (
                "Cargando referencia histórica…"
              ) : (
                <>
                  {apiRate?.message}{" "}
                  {apiRate?.source !== "preset" && apiRate?.symbol
                    ? `(${apiRate.symbol}, ${apiRate.source}`
                    : null}
                  {apiRate?.yearsUsed ? `, ${apiRate.yearsUsed} años` : null}
                  {apiRate?.source !== "preset" && apiRate?.symbol ? ")" : null}
                  {!useManualRate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-xs text-violet-400"
                      onClick={() => void loadRate(referenceId)}
                    >
                      Actualizar
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Resultado estimado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-violet-600/10 px-3 py-3">
                <p className="text-xs text-slate-400">Capital final</p>
                <p className="text-lg font-bold text-violet-300">
                  {formatCurrency(projection.finalBalance)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-600/10 px-3 py-3">
                <p className="text-xs text-slate-400">Total aportado</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(projection.totalContributed)}
                </p>
              </div>
              <div className="rounded-lg bg-sky-600/10 px-3 py-3">
                <p className="text-xs text-slate-400">Ganancia est.</p>
                <p
                  className={`text-lg font-bold ${
                    projection.totalGain >= 0 ? "text-sky-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(projection.totalGain)}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Con “{selected.label}”: si aportas{" "}
              {formatCurrency(parseFloat(monthlyContribution) || 0)}
              /mes durante {years} años al {annualRate}% anual (compuesto
              mensual).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución año a año</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProjectionChart data={projection.years} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400">
                  <th className="py-2 pr-4 font-medium">Año</th>
                  <th className="py-2 pr-4 font-medium">Aportado</th>
                  <th className="py-2 pr-4 font-medium">Capital</th>
                  <th className="py-2 font-medium">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {projection.years.map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-slate-800/80 text-slate-200"
                  >
                    <td className="py-2 pr-4">{row.year}</td>
                    <td className="py-2 pr-4">{formatCurrency(row.contributed)}</td>
                    <td className="py-2 pr-4 font-medium text-violet-300">
                      {formatCurrency(row.balance)}
                    </td>
                    <td
                      className={`py-2 ${
                        row.gain >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(row.gain)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
