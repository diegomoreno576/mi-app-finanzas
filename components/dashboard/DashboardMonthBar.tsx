"use client";

import { Suspense } from "react";
import { DashboardMonthPicker } from "@/components/dashboard/DashboardMonthPicker";

export function DashboardMonthBar() {
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div>
        <p className="text-sm font-medium text-slate-200">Periodo activo</p>
        <p className="text-xs text-slate-500">
          Toda la app usa este mes para totales, salud, fijos y presupuestos
        </p>
      </div>
      <Suspense fallback={<div className="h-16 w-full max-w-xs animate-pulse rounded-lg bg-slate-700/40" />}>
        <DashboardMonthPicker />
      </Suspense>
    </div>
  );
}
