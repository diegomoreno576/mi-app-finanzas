export interface ProjectionInput {
  initialCapital: number;
  monthlyContribution: number;
  years: number;
  /** Rentabilidad anual en % (ej. 7 = 7%). */
  annualRatePercent: number;
}

export interface ProjectionYearRow {
  year: number;
  /** Capital al final del año */
  balance: number;
  /** Total aportado hasta ese año (inicial + cuotas) */
  contributed: number;
  /** Beneficio estimado = balance − aportado */
  gain: number;
}

export interface ProjectionResult {
  finalBalance: number;
  totalContributed: number;
  totalGain: number;
  annualRatePercent: number;
  years: ProjectionYearRow[];
}

/**
 * Interés compuesto mensual.
 * Aporte al final de cada mes; capitalización mensual.
 */
export function projectInvestment(input: ProjectionInput): ProjectionResult {
  const years = Math.max(1, Math.min(40, Math.floor(input.years)));
  const initial = Math.max(0, input.initialCapital);
  const monthly = Math.max(0, input.monthlyContribution);
  const annualRate = input.annualRatePercent / 100;
  const monthlyRate = annualRate / 12;
  const months = years * 12;

  let balance = initial;
  const rows: ProjectionYearRow[] = [];

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
    if (m % 12 === 0) {
      const year = m / 12;
      const contributed = initial + monthly * m;
      rows.push({
        year,
        balance: round2(balance),
        contributed: round2(contributed),
        gain: round2(balance - contributed),
      });
    }
  }

  const totalContributed = initial + monthly * months;
  const finalBalance = round2(balance);

  return {
    finalBalance,
    totalContributed: round2(totalContributed),
    totalGain: round2(finalBalance - totalContributed),
    annualRatePercent: input.annualRatePercent,
    years: rows,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** CAGR anualizado a partir de precio inicial y final en N años. */
export function annualizedReturnPercent(
  startPrice: number,
  endPrice: number,
  years: number
): number | null {
  if (startPrice <= 0 || endPrice <= 0 || years <= 0) return null;
  const cagr = Math.pow(endPrice / startPrice, 1 / years) - 1;
  return Math.round(cagr * 1000) / 10;
}
