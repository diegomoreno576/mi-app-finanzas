"use client";

import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  type HealthCategorySlice,
} from "@/lib/financial-health";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

interface HealthCategoryPieProps {
  data: HealthCategorySlice[];
}

export function HealthCategoryPie({ data }: HealthCategoryPieProps) {
  const defaultOpen = useMemo(() => {
    const otros = data.find((s) => s.category === "Otros" && s.items.length > 0);
    return otros?.category ?? data.find((s) => s.items.length > 0)?.category ?? null;
  }, [data]);

  const [openCategory, setOpenCategory] = useState<string | null>(defaultOpen);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sin gastos este mes"
        description="Cuando registres gastos verás aquí el desglose por categoría"
      />
    );
  }

  function toggle(category: string) {
    setOpenCategory((prev) => (prev === category ? null : category));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/20 p-2">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={98}
              paddingAngle={2}
              onClick={(_, index) => {
                const slice = data[index];
                if (slice) toggle(slice.category);
              }}
              style={{ cursor: "pointer" }}
            >
              {data.map((slice) => (
                <Cell
                  key={slice.category}
                  fill={slice.color}
                  stroke={
                    openCategory === slice.category ? "#f8fafc" : "transparent"
                  }
                  strokeWidth={openCategory === slice.category ? 2 : 0}
                  opacity={
                    openCategory && openCategory !== slice.category ? 0.45 : 1
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const payload = item?.payload as HealthCategorySlice | undefined;
                const bucket = payload ? BUCKET_LABELS[payload.bucket] : "";
                return [
                  `${formatCurrency(Number(value))}${bucket ? ` · ${bucket}` : ""}`,
                  payload?.category ?? "Categoría",
                ];
              }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="px-2 pb-2 text-center text-xs text-slate-500">
          Pulsa un trozo o una categoría para ver qué hay dentro
        </p>
      </div>

      <ul className="space-y-2">
        {data.map((slice) => {
          const isOpen = openCategory === slice.category;
          const canExpand = slice.items.length > 0;

          return (
            <li
              key={slice.category}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen
                  ? "border-slate-500/60 bg-slate-800/60"
                  : "border-slate-700/40 bg-slate-900/30"
              )}
            >
              <button
                type="button"
                onClick={() => canExpand && toggle(slice.category)}
                disabled={!canExpand}
                className={cn(
                  "flex w-full items-start justify-between gap-3 px-3 py-3 text-left",
                  canExpand ? "cursor-pointer hover:bg-slate-800/40" : "cursor-default"
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-100">
                        {slice.category}
                      </p>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          BUCKET_COLORS[slice.bucket].text,
                          "bg-slate-950/40"
                        )}
                      >
                        {BUCKET_LABELS[slice.bucket]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {slice.preview}
                      {canExpand ? ` · ${slice.items.length} mov.` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">
                      {formatCurrency(slice.amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {slice.percentOfExpenses}%
                    </p>
                  </div>
                  {canExpand && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-400 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </button>

              {isOpen && canExpand && (
                <div className="border-t border-slate-700/50 bg-slate-950/30 px-3 py-2">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Qué incluye {slice.category}
                  </p>
                  <ul className="space-y-1.5">
                    {slice.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-800/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-slate-200">{item.label}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <p className="shrink-0 font-medium text-slate-300">
                          {formatCurrency(item.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
