import { NextResponse } from "next/server";
import { getReferenceById } from "@/lib/investments/catalog";
import { fetchHistoricalAnnualRate } from "@/lib/investments/reference";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const referenceId = searchParams.get("referenceId") ?? "world";
  const ref = getReferenceById(referenceId);

  if (!ref.symbol) {
    return NextResponse.json(
      {
        referenceId: ref.id,
        label: ref.label,
        annualRatePercent: ref.presetAnnualRate,
        source: "preset" as const,
        yearsUsed: null,
        symbol: null,
        message: "Escenario preset (sin histórico de mercado).",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
        },
      }
    );
  }

  const historical = await fetchHistoricalAnnualRate(ref.symbol, 10);

  if (historical) {
    return NextResponse.json(
      {
        referenceId: ref.id,
        label: ref.label,
        symbol: historical.symbol,
        annualRatePercent: historical.annualRatePercent,
        source: historical.source,
        yearsUsed: historical.yearsUsed,
        asOf: historical.asOf,
        message: `Rentabilidad anualizada aproximada (${historical.yearsUsed} años, proxy educativo).`,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
        },
      }
    );
  }

  return NextResponse.json(
    {
      referenceId: ref.id,
      label: ref.label,
      symbol: ref.symbol,
      annualRatePercent: ref.presetAnnualRate,
      source: "preset" as const,
      yearsUsed: null,
      message:
        "No se pudo obtener histórico gratis; se usa el preset educativo.",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
      },
    }
  );
}
