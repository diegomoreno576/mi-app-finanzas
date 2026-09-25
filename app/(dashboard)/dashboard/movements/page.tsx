import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMonthBounds } from "@/lib/dashboard";
import { resolveMonthYear } from "@/lib/selected-month";
import { MovementsView } from "@/components/dashboard/movements/MovementsView";
import type { Transaction } from "@/types";

export const dynamic = "force-dynamic";

interface MovementsPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const params = await searchParams;
  const { month, year } = resolveMonthYear(params);
  const { start, end } = getMonthBounds(year, month);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Suspense fallback={null}>
      <MovementsView transactions={(data ?? []) as Transaction[]} />
    </Suspense>
  );
}
