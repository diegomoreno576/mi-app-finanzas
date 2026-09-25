"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hrefWithMonth,
  resolveMonthYear,
  writeMonthCookies,
} from "@/lib/selected-month";

export function useSelectedMonth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { month, year } = useMemo(
    () =>
      resolveMonthYear({
        month: searchParams.get("month"),
        year: searchParams.get("year"),
      }),
    [searchParams]
  );

  const setSelectedMonth = useCallback(
    (nextMonth: number, nextYear: number) => {
      const resolved = resolveMonthYear({ month: nextMonth, year: nextYear });
      writeMonthCookies(resolved.month, resolved.year);

      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(resolved.month));
      params.set("year", String(resolved.year));
      router.push(`${pathname}?${params.toString()}`);
      router.refresh();
    },
    [pathname, router, searchParams]
  );

  const buildHref = useCallback(
    (path: string) => hrefWithMonth(path, month, year),
    [month, year]
  );

  return { month, year, setSelectedMonth, buildHref };
}
