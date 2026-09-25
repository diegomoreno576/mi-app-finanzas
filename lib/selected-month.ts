import { getCurrentMonthYear, type MonthRef } from "@/lib/dashboard";

export const SELECTED_MONTH_COOKIE = "selected_month";
export const SELECTED_YEAR_COOKIE = "selected_year";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export function resolveMonthYear(input?: {
  month?: string | number | null;
  year?: string | number | null;
}): MonthRef {
  const current = getCurrentMonthYear();
  const monthNum =
    input?.month === undefined || input?.month === null || input.month === ""
      ? NaN
      : Number(input.month);
  const yearNum =
    input?.year === undefined || input?.year === null || input.year === ""
      ? NaN
      : Number(input.year);

  const month =
    Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12
      ? monthNum
      : current.month;
  const year =
    Number.isFinite(yearNum) && yearNum >= 2000 && yearNum <= 2100
      ? yearNum
      : current.year;

  return { month, year };
}

export function monthQueryString(month: number, year: number): string {
  return `month=${month}&year=${year}`;
}

export function hrefWithMonth(path: string, month: number, year: number): string {
  const base = path.split("?")[0];
  return `${base}?${monthQueryString(month, year)}`;
}

export function readMonthCookies(
  getCookie: (name: string) => string | undefined
): MonthRef {
  return resolveMonthYear({
    month: getCookie(SELECTED_MONTH_COOKIE),
    year: getCookie(SELECTED_YEAR_COOKIE),
  });
}

/** Escribe cookies del mes seleccionado (cliente). */
export function writeMonthCookies(month: number, year: number): void {
  const resolved = resolveMonthYear({ month, year });
  const common = `path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  document.cookie = `${SELECTED_MONTH_COOKIE}=${resolved.month}; ${common}`;
  document.cookie = `${SELECTED_YEAR_COOKIE}=${resolved.year}; ${common}`;
}

export function parseCookieHeader(
  cookieHeader: string | null,
  name: string
): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
