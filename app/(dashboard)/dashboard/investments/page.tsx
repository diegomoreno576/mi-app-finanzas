import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  calculateMonthlySummary,
  dedupeSalaryTransactions,
  getMonthBounds,
} from "@/lib/dashboard";
import { resolveMonthYear } from "@/lib/selected-month";
import { InvestmentsView } from "@/components/dashboard/investments/InvestmentsView";
import type { Transaction } from "@/types";

export const dynamic = "force-dynamic";

interface InvestmentsPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function InvestmentsPage({
  searchParams,
}: InvestmentsPageProps) {
  const params = await searchParams;
  const { month, year } = resolveMonthYear(params);
  const { start, end } = getMonthBounds(year, month);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let suggestedMonthly = 0;
  if (user) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end);
    const summary = calculateMonthlySummary(
      dedupeSalaryTransactions((data ?? []) as Transaction[])
    );
    suggestedMonthly = Math.max(0, summary.balance);
  }

  return (
    <Suspense fallback={null}>
      <InvestmentsView suggestedMonthly={suggestedMonthly} />
    </Suspense>
  );
}
