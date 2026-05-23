"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { getMonthName } from "@/lib/format";

interface DashboardMonthPickerProps {
  month: number;
  year: number;
}

export function DashboardMonthPicker({ month, year }: DashboardMonthPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  function updatePeriod(newMonth: number, newYear: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    router.push(`/dashboard?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="min-w-[160px] flex-1 space-y-1 sm:max-w-xs">
        <label className="text-xs text-slate-400">Mes del resumen</label>
        <Select
          value={month}
          onChange={(e) => updatePeriod(Number(e.target.value), year)}
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {getMonthName(m, year)}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-[100px] space-y-1 sm:max-w-[120px]">
        <label className="text-xs text-slate-400">Año</label>
        <Select
          value={year}
          onChange={(e) => updatePeriod(month, Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
