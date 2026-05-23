"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { MonthlyComparison } from "@/types";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface IncomeExpenseBarChartProps {
  data: MonthlyComparison[];
}

export function IncomeExpenseBarChart({ data }: IncomeExpenseBarChartProps) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="Sin datos históricos"
        description="Registra transacciones para ver la evolución"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#f1f5f9",
          }}
        />
        <Legend />
        <Bar dataKey="income" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
