import { Suspense } from "react";
import { RecurringView } from "@/components/dashboard/recurring/RecurringView";

export default function RecurringPage() {
  return (
    <Suspense fallback={null}>
      <RecurringView />
    </Suspense>
  );
}
