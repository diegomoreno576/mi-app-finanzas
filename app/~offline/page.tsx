import Link from "next/link";
import { WifiOff } from "lucide-react";
import { RetryButton } from "@/app/~offline/RetryButton";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20">
        <WifiOff className="h-8 w-8 text-violet-400" />
      </div>
      <h1 className="text-2xl font-bold text-white">Sin conexión</h1>
      <p className="mt-2 max-w-sm text-slate-400">
        No hay internet. Puedes ver páginas visitadas antes; para datos nuevos
        necesitas conexión.
      </p>
      <div className="mt-8">
        <RetryButton />
      </div>
      <Link
        href="/dashboard"
        className="mt-4 text-sm text-violet-400 hover:text-violet-300"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
