import { Suspense } from "react";
import { BudgetsView } from "@/components/dashboard/budgets/BudgetsView";

export default function BudgetsPage() {
  return (
    <Suspense fallback={null}>
      <BudgetsView />
    </Suspense>
  );
}
