import type { Category, CategoryBucket, Transaction } from "@/types";

export const RULE_50_30_20 = {
  needs: 50,
  wants: 30,
  savings: 20,
} as const;

/** Fallback por nombre si la categoría no tiene bucket en BD. */
export const DEFAULT_BUCKET_BY_NAME: Record<string, CategoryBucket> = {
  // Necesidades (50%)
  Vivienda: "needs",
  Alquiler: "needs",
  Hipoteca: "needs",
  Alimentación: "needs",
  Comida: "needs",
  Suministros: "needs",
  Luz: "needs",
  Agua: "needs",
  Gas: "needs",
  Transporte: "needs",
  Salud: "needs",
  Educación: "needs",
  // Deseos (30%)
  Ocio: "wants",
  Suscripciones: "wants",
  Ropa: "wants",
  Otros: "wants",
};

export type HealthLevel = "critical" | "fair" | "good" | "excellent";

export interface BucketAmounts {
  needs: number;
  wants: number;
  savings: number;
}

export interface BucketPercents {
  needs: number;
  wants: number;
  savings: number;
}

export interface FinancialHealthResult {
  income: number;
  expense: number;
  balance: number;
  inDeficit: boolean;
  amounts: BucketAmounts;
  percents: BucketPercents;
  targets: typeof RULE_50_30_20;
  score: number;
  level: HealthLevel;
  levelLabel: string;
  tips: string[];
  /** Referencia secundaria: tasa de ahorro real vs 20%. */
  savingsRate: number;
  secondaryNote: string;
}

function resolveBucket(
  categoryName: string,
  categoriesByName: Map<string, Category>
): CategoryBucket {
  const cat = categoriesByName.get(categoryName);
  if (cat?.type === "expense" && cat.bucket) return cat.bucket;
  return DEFAULT_BUCKET_BY_NAME[categoryName] ?? "wants";
}

export function buildCategoryNameMap(categories: Category[]): Map<string, Category> {
  const map = new Map<string, Category>();
  for (const c of categories) {
    if (c.type === "expense") map.set(c.name, c);
  }
  return map;
}

export function sumExpensesByBucket(
  transactions: Transaction[],
  categories: Category[]
): BucketAmounts {
  const byName = buildCategoryNameMap(categories);
  const amounts: BucketAmounts = { needs: 0, wants: 0, savings: 0 };

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const bucket = resolveBucket(t.category, byName);
    amounts[bucket] += Number(t.amount);
  }

  return amounts;
}

export interface HealthCategoryItem {
  id: string;
  label: string;
  amount: number;
  date: string;
}

export interface HealthCategorySlice {
  category: string;
  amount: number;
  bucket: CategoryBucket;
  color: string;
  /** % sobre el total del desglose (gastos + ahorro no gastado) */
  percentOfExpenses: number;
  items: HealthCategoryItem[];
  /** Resumen corto para la fila (ej. "Luz, Agua y 2 más") */
  preview: string;
}

const FALLBACK_COLORS = [
  "#38bdf8",
  "#f59e0b",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#fb7185",
  "#2dd4bf",
  "#818cf8",
];

function itemLabel(description: string | null): string {
  const trimmed = description?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Sin descripción";
}

function buildPreview(labels: string[]): string {
  const unique = [...new Set(labels)];
  if (unique.length === 0) return "Sin movimientos";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} · ${unique[1]}`;
  return `${unique[0]} · ${unique[1]} · y ${unique.length - 2} más`;
}

/**
 * Desglose por categoría de gasto + bucket 50/30/20 (para el pie detallado).
 * Incluye movimientos para poder abrir “qué hay dentro” (p. ej. Otros).
 * Si hay balance positivo, añade un slice "Sin gastar (ahorro)".
 */
export function buildHealthCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  balance = 0
): HealthCategorySlice[] {
  const byName = buildCategoryNameMap(categories);
  const totals = new Map<
    string,
    {
      amount: number;
      bucket: CategoryBucket;
      color: string;
      items: HealthCategoryItem[];
    }
  >();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const name = t.category;
    const bucket = resolveBucket(name, byName);
    const cat = byName.get(name);
    const label = itemLabel(t.description);
    const item: HealthCategoryItem = {
      id: t.id,
      label,
      amount: Number(t.amount),
      date: t.date,
    };
    const existing = totals.get(name);
    if (existing) {
      existing.amount += Number(t.amount);
      existing.items.push(item);
    } else {
      totals.set(name, {
        amount: Number(t.amount),
        bucket,
        color: cat?.color ?? FALLBACK_COLORS[totals.size % FALLBACK_COLORS.length],
        items: [item],
      });
    }
  }

  if (balance > 0) {
    totals.set("Sin gastar (ahorro)", {
      amount: balance,
      bucket: "savings",
      color: "#10b981",
      items: [],
    });
  }

  const total = Array.from(totals.values()).reduce((s, r) => s + r.amount, 0);
  if (total <= 0) return [];

  return Array.from(totals.entries())
    .map(([category, row]) => {
      const items = [...row.items].sort((a, b) => b.amount - a.amount);
      return {
        category,
        amount: row.amount,
        bucket: row.bucket,
        color: row.color,
        percentOfExpenses: Math.round((row.amount / total) * 1000) / 10,
        items,
        preview:
          category === "Sin gastar (ahorro)"
            ? "Ingreso no gastado este mes"
            : buildPreview(items.map((i) => i.label)),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}


function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function scoreFromPercents(percents: BucketPercents): number {
  const deviation =
    Math.abs(percents.needs - RULE_50_30_20.needs) +
    Math.abs(percents.wants - RULE_50_30_20.wants) +
    Math.abs(percents.savings - RULE_50_30_20.savings);
  // Desviación máxima teórica ~200 → normalizar a 0–100
  return Math.max(0, Math.min(100, Math.round(100 - deviation / 2)));
}

export function levelFromScore(score: number): {
  level: HealthLevel;
  label: string;
} {
  if (score >= 80) return { level: "excellent", label: "Excelente" };
  if (score >= 60) return { level: "good", label: "Bueno" };
  if (score >= 40) return { level: "fair", label: "Regular" };
  return { level: "critical", label: "Crítico" };
}

function buildTips(
  percents: BucketPercents,
  inDeficit: boolean,
  income: number
): string[] {
  if (income <= 0) {
    return [
      "Añade tus ingresos del mes para calcular la salud con la regla 50/30/20.",
    ];
  }

  const tips: string[] = [];

  if (inDeficit) {
    tips.push(
      "Este mes gastas más de lo que entra. Prioriza necesidades y recorta deseos hasta equilibrar."
    );
  }

  const gaps = [
    {
      key: "needs" as const,
      label: "necesidades",
      target: RULE_50_30_20.needs,
      over: "Las necesidades superan el 50%. Revisa vivienda, transporte o suscripciones esenciales.",
      under: "Tus necesidades están por debajo del 50%. Si es sostenible, genial; si falta algo esencial, no lo recortes de más.",
    },
    {
      key: "wants" as const,
      label: "deseos",
      target: RULE_50_30_20.wants,
      over: "Los deseos pasan del 30%. Baja ocio, ropa o suscripciones no esenciales este mes.",
      under: "Vas bien en deseos (≤30%). Mantén ese margen para no comerse el ahorro.",
    },
    {
      key: "savings" as const,
      label: "ahorro",
      target: RULE_50_30_20.savings,
      over: "Estás ahorrando más del 20%. Buen ritmo si tus necesidades están cubiertas.",
      under: "El ahorro está por debajo del 20%. Intenta automatizar una transferencia el día de cobro.",
    },
  ];

  const worst = [...gaps].sort(
    (a, b) =>
      Math.abs(percents[b.key] - b.target) - Math.abs(percents[a.key] - a.target)
  )[0];

  if (percents[worst.key] > worst.target) {
    tips.push(worst.over);
  } else if (percents[worst.key] < worst.target - 2) {
    tips.push(worst.under);
  }

  if (tips.length < 2) {
    const second = gaps.find((g) => g.key !== worst.key)!;
    if (percents[second.key] > second.target) tips.push(second.over);
    else if (percents[second.key] < second.target - 2) tips.push(second.under);
  }

  if (tips.length === 0) {
    tips.push(
      "Estás muy cerca del 50/30/20. Sigue registrando gastos para mantener el control."
    );
  }

  return tips.slice(0, 3);
}

/**
 * Calcula salud financiera del mes.
 * savings = gastos bucket savings + max(0, income − expenses).
 */
export function calculateFinancialHealth(
  income: number,
  expense: number,
  bucketExpenses: BucketAmounts
): FinancialHealthResult {
  const balance = income - expense;
  const inDeficit = balance < 0;
  const unspentSavings = Math.max(0, balance);
  const savingsTotal = bucketExpenses.savings + unspentSavings;

  const amounts: BucketAmounts = {
    needs: bucketExpenses.needs,
    wants: bucketExpenses.wants,
    savings: savingsTotal,
  };

  const percents: BucketPercents = {
    needs: pct(amounts.needs, income),
    wants: pct(amounts.wants, income),
    savings: pct(amounts.savings, income),
  };

  const score = income > 0 ? scoreFromPercents(percents) : 0;
  const { level, label } = levelFromScore(score);
  const savingsRate = percents.savings;

  let secondaryNote: string;
  if (income <= 0) {
    secondaryNote = "Sin ingresos no se puede comparar la tasa de ahorro.";
  } else if (savingsRate >= 20) {
    secondaryNote = `Tasa de ahorro ${savingsRate}% (objetivo ≥20%). Vas en buen camino.`;
  } else {
    secondaryNote = `Tasa de ahorro ${savingsRate}% frente al 20% recomendado. Cada punto cuenta.`;
  }

  return {
    income,
    expense,
    balance,
    inDeficit,
    amounts,
    percents,
    targets: RULE_50_30_20,
    score,
    level,
    levelLabel: label,
    tips: buildTips(percents, inDeficit, income),
    savingsRate,
    secondaryNote,
  };
}

export function calculateFinancialHealthFromTransactions(
  transactions: Transaction[],
  categories: Category[],
  income: number,
  expense: number
): FinancialHealthResult {
  const bucketExpenses = sumExpensesByBucket(transactions, categories);
  return calculateFinancialHealth(income, expense, bucketExpenses);
}

export const BUCKET_LABELS: Record<CategoryBucket, string> = {
  needs: "Necesidades",
  wants: "Deseos",
  savings: "Ahorro",
};

export const BUCKET_COLORS: Record<
  CategoryBucket,
  { bar: string; text: string }
> = {
  needs: { bar: "bg-sky-500", text: "text-sky-400" },
  wants: { bar: "bg-amber-500", text: "text-amber-400" },
  savings: { bar: "bg-emerald-500", text: "text-emerald-400" },
};

export const HEALTH_LEVEL_COLORS: Record<HealthLevel, string> = {
  critical: "text-red-400",
  fair: "text-amber-400",
  good: "text-sky-400",
  excellent: "text-emerald-400",
};
