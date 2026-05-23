import { InstallAppButton } from "@/components/pwa/InstallAppButton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        {children}
        <InstallAppButton variant="primary" />
      </div>
    </div>
  );
}
