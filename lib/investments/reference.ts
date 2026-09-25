import { annualizedReturnPercent } from "@/lib/investments/projection";

export interface HistoricalReferenceResult {
  symbol: string;
  annualRatePercent: number;
  yearsUsed: number;
  startPrice: number;
  endPrice: number;
  source: "yahoo" | "finnhub" | "alpha_vantage" | "preset";
  asOf: string;
}

type CacheEntry = { expires: number; data: HistoricalReferenceResult };

const memoryCache = new Map<string, CacheEntry>();
const CACHE_MS = 24 * 60 * 60 * 1000;

function getCached(symbol: string): HistoricalReferenceResult | null {
  const hit = memoryCache.get(symbol);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    memoryCache.delete(symbol);
    return null;
  }
  return hit.data;
}

function setCache(symbol: string, data: HistoricalReferenceResult) {
  memoryCache.set(symbol, { expires: Date.now() + CACHE_MS, data });
}

async function fetchYahooMonthlyCloses(
  symbol: string,
  yearsBack: number
): Promise<{ date: number; close: number }[] | null> {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - yearsBack * 365.25 * 24 * 60 * 60;
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set("period1", String(Math.floor(period1)));
  url.searchParams.set("period2", String(period2));
  url.searchParams.set("interval", "1mo");
  url.searchParams.set("events", "history");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MiFinanzas/1.0)" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: (number | null)[] }> };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!timestamps?.length || !closes?.length) return null;

  const points: { date: number; close: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (typeof c === "number" && Number.isFinite(c) && c > 0) {
      points.push({ date: timestamps[i], close: c });
    }
  }
  return points.length >= 12 ? points : null;
}

async function fetchFinnhubCandles(
  symbol: string,
  yearsBack: number,
  apiKey: string
): Promise<{ date: number; close: number }[] | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - Math.floor(yearsBack * 365.25 * 24 * 60 * 60);
  const url = new URL("https://finnhub.io/api/v1/stock/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", "M");
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));
  url.searchParams.set("token", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    s?: string;
    t?: number[];
    c?: number[];
  };
  if (json.s !== "ok" || !json.t?.length || !json.c?.length) return null;

  const points: { date: number; close: number }[] = [];
  for (let i = 0; i < json.t.length; i++) {
    const c = json.c[i];
    if (typeof c === "number" && c > 0) {
      points.push({ date: json.t[i], close: c });
    }
  }
  return points.length >= 12 ? points : null;
}

function fromPoints(
  symbol: string,
  points: { date: number; close: number }[],
  source: HistoricalReferenceResult["source"]
): HistoricalReferenceResult | null {
  const first = points[0];
  const last = points[points.length - 1];
  const yearsUsed =
    Math.round(((last.date - first.date) / (365.25 * 24 * 60 * 60)) * 10) / 10;
  if (yearsUsed < 1) return null;
  const rate = annualizedReturnPercent(first.close, last.close, yearsUsed);
  if (rate === null) return null;

  return {
    symbol,
    annualRatePercent: Math.max(-20, Math.min(30, rate)),
    yearsUsed,
    startPrice: first.close,
    endPrice: last.close,
    source,
    asOf: new Date(last.date * 1000).toISOString().slice(0, 10),
  };
}

/**
 * Obtiene rentabilidad anualizada histórica (gratis).
 * Orden: cache → Yahoo (sin key) → Finnhub (si hay key).
 */
export async function fetchHistoricalAnnualRate(
  symbol: string,
  yearsBack = 10
): Promise<HistoricalReferenceResult | null> {
  const cached = getCached(symbol);
  if (cached) return cached;

  try {
    const yahoo = await fetchYahooMonthlyCloses(symbol, yearsBack);
    if (yahoo) {
      const result = fromPoints(symbol, yahoo, "yahoo");
      if (result) {
        setCache(symbol, result);
        return result;
      }
    }
  } catch {
    // continuar
  }

  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const candles = await fetchFinnhubCandles(symbol, yearsBack, finnhubKey);
      if (candles) {
        const result = fromPoints(symbol, candles, "finnhub");
        if (result) {
          setCache(symbol, result);
          return result;
        }
      }
    } catch {
      // continuar
    }
  }

  return null;
}
