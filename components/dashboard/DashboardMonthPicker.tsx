"use client";

import { Select } from "@/components/ui/select";
import { getMonthName } from "@/lib/format";
import { useSelectedMonth } from "@/lib/hooks/useSelectedMonth";

/** Selector global del mes de la app (escribe URL + cookie). */
export function DashboardMonthPicker() {
  const { month, year, setSelectedMonth } = useSelectedMonth();

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:max-w-xs">
      <div className="min-w-0 space-y-1">
        <label className="text-xs text-slate-400">Mes</label>
        <Select
          value={month}
          onChange={(e) => setSelectedMonth(Number(e.target.value), year)}
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {getMonthName(m, year)}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-0 space-y-1">
        <label className="text-xs text-slate-400">Año</label>
        <Select
          value={year}
          onChange={(e) => setSelectedMonth(month, Number(e.target.value))}
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
