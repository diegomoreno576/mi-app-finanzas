export type RiskScenario = "conservative" | "moderate" | "aggressive" | "custom";

export type PortfolioKind =
  | "liquidity"
  | "fixed_income"
  | "balanced"
  | "equity"
  | "thematic";

export interface InvestmentReference {
  id: string;
  /** Nombre corto para el selector / ficha. */
  label: string;
  /** Tipo de producto o cartera (educativo). */
  kind: PortfolioKind;
  kindLabel: string;
  /** Qué es, en 1–2 frases. */
  description: string;
  /** A quién suele encajar (orientativo). */
  suitedFor: string;
  /** Horizonte típico en años. */
  horizon: string;
  /** Etiqueta de riesgo legible. */
  riskLabel: string;
  /** Composición aproximada (educativa). */
  assetMix: string;
  /** Ticker para APIs públicas (proxy educativo si no es UCITS). */
  symbol: string | null;
  /** Rentabilidad anual por defecto si no hay API (%). */
  presetAnnualRate: number;
  scenario: Exclude<RiskScenario, "custom">;
}

export const PORTFOLIO_KIND_ORDER: PortfolioKind[] = [
  "liquidity",
  "fixed_income",
  "balanced",
  "equity",
  "thematic",
];

/** Catálogo curado: proxies educativos (histórico ≈ referencia, no producto a comprar). */
export const INVESTMENT_REFERENCES: InvestmentReference[] = [
  {
    id: "cash",
    label: "Liquidez / ahorros",
    kind: "liquidity",
    kindLabel: "Liquidez",
    description:
      "Dinero fácil de usar: cuenta remunerada, depósito o fondo monetario. Prioriza disponibilidad y estabilidad frente a rentabilidad.",
    suitedFor: "Colchón de emergencia o dinero que puedas necesitar en meses.",
    horizon: "0–2 años",
    riskLabel: "Muy bajo",
    assetMix: "Efectivo / depósitos / monetarios ≈ 100%",
    symbol: null,
    presetAnnualRate: 2.5,
    scenario: "conservative",
  },
  {
    id: "bonds",
    label: "Renta fija (bonos)",
    kind: "fixed_income",
    kindLabel: "Renta fija",
    description:
      "Cartera orientada a deuda pública y corporativa. Suele oscilar menos que la bolsa, pero también puede perder valor si suben los tipos.",
    suitedFor: "Quien busca más rentabilidad que el efectivo, con volatilidad moderada-baja.",
    horizon: "3–7 años",
    riskLabel: "Bajo–medio",
    assetMix: "Bonos ≈ 100%",
    symbol: "BND",
    presetAnnualRate: 3,
    scenario: "conservative",
  },
  {
    id: "balanced",
    label: "Cartera equilibrada 60/40",
    kind: "balanced",
    kindLabel: "Mixta",
    description:
      "Clásico mixto: ~60% bolsa + ~40% renta fija. Busca crecimiento con un freno en las caídas. Referencia típica de “perfil moderado”.",
    suitedFor: "Objetivos a medio plazo (casa, coche, ahorro general) sin ir a todo o nada.",
    horizon: "5–15 años",
    riskLabel: "Medio",
    assetMix: "Renta variable ≈ 60% · Renta fija ≈ 40%",
    symbol: null,
    presetAnnualRate: 5,
    scenario: "moderate",
  },
  {
    id: "world",
    label: "Renta variable global",
    kind: "equity",
    kindLabel: "Renta variable",
    description:
      "Fondo/índice diversificado en empresas de muchos países (tipo MSCI World). Un solo “producto” para exposerte a la bolsa mundial.",
    suitedFor: "Horizonte largo y tolerancia a subidas y bajadas del mercado.",
    horizon: "10+ años",
    riskLabel: "Medio–alto",
    assetMix: "Acciones globales ≈ 100%",
    symbol: "URTH",
    presetAnnualRate: 6,
    scenario: "moderate",
  },
  {
    id: "us",
    label: "Renta variable USA (S&P 500)",
    kind: "equity",
    kindLabel: "Renta variable",
    description:
      "Las 500 mayores empresas de EE. UU. Históricamente muy usada como referencia de bolsa; concentrada en un solo país y en grandes tecnológicas.",
    suitedFor: "Quién acepta más volatilidad a cambio de potencial de crecimiento a largo plazo.",
    horizon: "10+ años",
    riskLabel: "Alto",
    assetMix: "Acciones EE. UU. ≈ 100%",
    symbol: "SPY",
    presetAnnualRate: 7,
    scenario: "aggressive",
  },
  {
    id: "europe",
    label: "Renta variable Europa",
    kind: "equity",
    kindLabel: "Renta variable",
    description:
      "Empresas europeas (proxy educativo vía ETF). Menos peso tecnológico que EE. UU.; útil para diversificar geográficamente.",
    suitedFor: "Complemento a cartera global o preferencia por mercado europeo.",
    horizon: "10+ años",
    riskLabel: "Medio–alto",
    assetMix: "Acciones Europa ≈ 100%",
    symbol: "VGK",
    presetAnnualRate: 5.5,
    scenario: "moderate",
  },
  {
    id: "emerging",
    label: "Mercados emergentes",
    kind: "equity",
    kindLabel: "Renta variable",
    description:
      "Países en desarrollo (China, India, Brasil, etc.). Más potencial y más vaivén: no suele ser el núcleo de una cartera, sino un satélite.",
    suitedFor: "Parte pequeña de una cartera ya diversificada, con estómago para volatilidad.",
    horizon: "10+ años",
    riskLabel: "Muy alto",
    assetMix: "Acciones emergentes ≈ 100%",
    symbol: "EEM",
    presetAnnualRate: 6.5,
    scenario: "aggressive",
  },
  {
    id: "dividends",
    label: "Acciones de dividendos",
    kind: "thematic",
    kindLabel: "Temático",
    description:
      "Empresas que reparte beneficios de forma recurrente. Orientada a renta/flujo, no solo a revalorización del precio.",
    suitedFor: "Quién valora ingresos periódicos o un perfil algo más “calidad / estable”.",
    horizon: "7+ años",
    riskLabel: "Medio",
    assetMix: "Acciones con dividendo ≈ 100%",
    symbol: "SCHD",
    presetAnnualRate: 5.5,
    scenario: "moderate",
  },
  {
    id: "reits",
    label: "Inmobiliario (REITs)",
    kind: "thematic",
    kindLabel: "Alternativo",
    description:
      "Sociedades que invierten en inmuebles (oficinas, locales, viviendas…). Alternativa a comprar piso directo; cotiza como una acción/fondo.",
    suitedFor: "Diversificar fuera de solo bolsa y bonos; no sustituye tu vivienda habitual.",
    horizon: "7+ años",
    riskLabel: "Medio–alto",
    assetMix: "REITs / inmobiliario cotizado ≈ 100%",
    symbol: "VNQ",
    presetAnnualRate: 5,
    scenario: "moderate",
  },
];

export function getReferenceById(id: string): InvestmentReference {
  return (
    INVESTMENT_REFERENCES.find((r) => r.id === id) ?? INVESTMENT_REFERENCES[3]
  );
}

export function groupReferencesByKind(): {
  kind: PortfolioKind;
  kindLabel: string;
  items: InvestmentReference[];
}[] {
  return PORTFOLIO_KIND_ORDER.map((kind) => {
    const items = INVESTMENT_REFERENCES.filter((r) => r.kind === kind);
    return {
      kind,
      kindLabel: items[0]?.kindLabel ?? kind,
      items,
    };
  }).filter((g) => g.items.length > 0);
}
