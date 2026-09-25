import {
  calculateFinancialHealth,
  type BucketAmounts,
  type FinancialHealthResult,
} from "@/lib/financial-health";
import type { CategoryBucket } from "@/types";

export type AffordabilityVerdict =
  | "comfortable"
  | "tight"
  | "stretch"
  | "no";

export type DecisionScenarioId =
  | "car"
  | "rent"
  | "phone"
  | "subscription"
  | "gym"
  | "custom";

export interface DecisionScenario {
  id: DecisionScenarioId;
  label: string;
  description: string;
  /** Bucket 50/30/20 por defecto para este gasto. */
  defaultBucket: CategoryBucket;
  /** Placeholder orientativo (€/mes). */
  exampleAmount: number;
}

export const DECISION_SCENARIOS: DecisionScenario[] = [
  {
    id: "car",
    label: "Coche (cuota mensual)",
    description:
      "Financiación, renting o leasing. Suele ser un gasto fijo de necesidades (transporte).",
    defaultBucket: "needs",
    exampleAmount: 250,
  },
  {
    id: "rent",
    label: "Vivienda (alquiler / hipoteca)",
    description: "Subida de alquiler, nueva hipoteca o cambio de piso.",
    defaultBucket: "needs",
    exampleAmount: 200,
  },
  {
    id: "phone",
    label: "Móvil / internet",
    description: "Nueva tarifa o pack fijo de comunicaciones.",
    defaultBucket: "needs",
    exampleAmount: 40,
  },
  {
    id: "subscription",
    label: "Suscripción / streaming",
    description: "Netflix, Spotify, software… gasto recurrente de deseos.",
    defaultBucket: "wants",
    exampleAmount: 15,
  },
  {
    id: "gym",
    label: "Gimnasio / ocio fijo",
    description: "Cuota de gym, hobbies o actividades recurrentes.",
    defaultBucket: "wants",
    exampleAmount: 40,
  },
  {
    id: "custom",
    label: "Otro gasto fijo",
    description: "Cualquier compromiso mensual nuevo que quieras valorar.",
    defaultBucket: "needs",
    exampleAmount: 100,
  },
];

export function getScenarioById(id: string): DecisionScenario {
  return DECISION_SCENARIOS.find((s) => s.id === id) ?? DECISION_SCENARIOS[5];
}

/** Snapshot de tus números del mes / compromisos (servidor → cliente). */
export interface AffordabilitySnapshot {
  monthLabel: string;
  income: number;
  expense: number;
  monthBalance: number;
  /** Ingresos fijos − gastos fijos − cuotas de plazos. */
  projectedBalance: number;
  fixedExpenseCommitment: number;
  installmentMonthly: number;
  incomeCommitment: number;
  bucketExpenses: BucketAmounts;
  health: FinancialHealthResult;
}

export interface AffordabilityEvaluation {
  monthlyAmount: number;
  bucket: CategoryBucket;
  afterMonthBalance: number;
  afterProjectedBalance: number;
  healthBefore: FinancialHealthResult;
  healthAfter: FinancialHealthResult;
  verdict: AffordabilityVerdict;
  verdictLabel: string;
  summary: string;
  reasons: string[];
  /** Máximo orientativo que podrías sumar sin romper proyección ni ahorro mínimo. */
  maxSuggestedMonthly: number;
}

const VERDICT_LABELS: Record<AffordabilityVerdict, string> = {
  comfortable: "Encaja bastante bien",
  tight: "Puede cuadrar, pero justo",
  stretch: "Te aprieta el mes",
  no: "Ahora mismo no encaja",
};

function evaluateVerdict(params: {
  monthlyAmount: number;
  afterMonthBalance: number;
  afterProjectedBalance: number;
  healthBefore: FinancialHealthResult;
  healthAfter: FinancialHealthResult;
}): { verdict: AffordabilityVerdict; reasons: string[] } {
  const {
    monthlyAmount,
    afterMonthBalance,
    afterProjectedBalance,
    healthBefore,
    healthAfter,
  } = params;
  const reasons: string[] = [];

  if (monthlyAmount <= 0) {
    return {
      verdict: "comfortable",
      reasons: ["Indica un importe mensual para valorar el impacto."],
    };
  }

  if (healthBefore.income <= 0) {
    return {
      verdict: "no",
      reasons: [
        "No hay ingresos registrados este mes: no se puede valorar con seguridad.",
      ],
    };
  }

  if (afterProjectedBalance < 0) {
    reasons.push(
      `Con tus fijos y plazos, el mes quedaría en negativo (${Math.round(afterProjectedBalance)} €).`
    );
  }
  if (afterMonthBalance < 0) {
    reasons.push(
      `Con el gasto del mes actual, el balance pasaría a negativo (${Math.round(afterMonthBalance)} €).`
    );
  }
  if (afterProjectedBalance < 0 || afterMonthBalance < 0) {
    return { verdict: "no", reasons };
  }

  if (healthAfter.savingsRate < 10) {
    reasons.push(
      `La tasa de ahorro bajará a ~${healthAfter.savingsRate}% (objetivo orientativo ≥20%).`
    );
    return { verdict: "stretch", reasons };
  }

  if (healthAfter.percents.needs > 55) {
    reasons.push(
      `Las necesidades subirían a ~${healthAfter.percents.needs}% del ingreso (referencia 50%).`
    );
  }

  const cushion = Math.min(afterProjectedBalance, afterMonthBalance);
  if (cushion < monthlyAmount * 0.5 || healthAfter.savingsRate < 15) {
    reasons.push(
      `Te quedaría poco margen (~${Math.round(cushion)} €/mes) o el ahorro quedaría por debajo del 15%.`
    );
    return { verdict: "tight", reasons };
  }

  if (healthAfter.savingsRate < 20) {
    reasons.push(
      `Seguirías en positivo; el ahorro quedaría en ~${healthAfter.savingsRate}% (un poco bajo el 20% ideal).`
    );
    return { verdict: "tight", reasons };
  }

  reasons.push(
    `Mantienes superávit (~${Math.round(cushion)} €/mes) y una tasa de ahorro ~${healthAfter.savingsRate}%.`
  );
  return { verdict: "comfortable", reasons };
}

/** Máximo que podrías añadir dejando ≥50 € de proyección y ≥15% ahorro. */
export function suggestMaxMonthly(
  snapshot: AffordabilitySnapshot,
  bucket: CategoryBucket
): number {
  const { income, expense, monthBalance, projectedBalance, bucketExpenses } =
    snapshot;
  if (income <= 0) return 0;

  let lo = 0;
  let hi = Math.max(0, Math.min(monthBalance, projectedBalance));
  let best = 0;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const afterBuckets = { ...bucketExpenses };
    afterBuckets[bucket] += mid;
    const health = calculateFinancialHealth(income, expense + mid, afterBuckets);
    const afterProj = projectedBalance - mid;
    const afterMonth = monthBalance - mid;
    const ok =
      mid === 0 ||
      (afterProj >= 50 && afterMonth >= 0 && health.savingsRate >= 15);
    if (ok) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best;
}

export function evaluateAffordability(
  snapshot: AffordabilitySnapshot,
  monthlyAmount: number,
  bucket: CategoryBucket
): AffordabilityEvaluation {
  const amount = Math.max(0, Number.isFinite(monthlyAmount) ? monthlyAmount : 0);
  const afterMonthBalance = snapshot.monthBalance - amount;
  const afterProjectedBalance = snapshot.projectedBalance - amount;

  const afterBuckets: BucketAmounts = {
    needs: snapshot.bucketExpenses.needs,
    wants: snapshot.bucketExpenses.wants,
    savings: snapshot.bucketExpenses.savings,
  };
  afterBuckets[bucket] += amount;

  const healthAfter = calculateFinancialHealth(
    snapshot.income,
    snapshot.expense + amount,
    afterBuckets
  );

  const { verdict, reasons } = evaluateVerdict({
    monthlyAmount: amount,
    afterMonthBalance,
    afterProjectedBalance,
    healthBefore: snapshot.health,
    healthAfter,
  });

  const maxSuggestedMonthly = suggestMaxMonthly(snapshot, bucket);

  let summary: string;
  if (amount <= 0) {
    summary = "Elige un escenario e indica cuánto costaría al mes.";
  } else if (verdict === "comfortable") {
    summary = `Un gasto fijo de ${Math.round(amount)} €/mes parece encajar con tus números actuales.`;
  } else if (verdict === "tight") {
    summary = `Podrías asumir ${Math.round(amount)} €/mes, pero te quedaría poco margen.`;
  } else if (verdict === "stretch") {
    summary = `${Math.round(amount)} €/mes te dejaría el mes muy justo o casi sin ahorro.`;
  } else {
    summary = `Con tus ingresos, fijos y plazos actuales, ${Math.round(amount)} €/mes no encaja.`;
  }

  return {
    monthlyAmount: amount,
    bucket,
    afterMonthBalance,
    afterProjectedBalance,
    healthBefore: snapshot.health,
    healthAfter,
    verdict,
    verdictLabel: VERDICT_LABELS[verdict],
    summary,
    reasons,
    maxSuggestedMonthly,
  };
}
