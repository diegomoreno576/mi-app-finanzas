import { Suspense } from "react";
import { InstallmentsView } from "@/components/dashboard/installments/InstallmentsView";

export default function InstallmentsPage() {
  return (
    <Suspense fallback={null}>
      <InstallmentsView />
    </Suspense>
  );
}
