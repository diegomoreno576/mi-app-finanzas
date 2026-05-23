import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:p-4 lg:pb-8 lg:p-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
