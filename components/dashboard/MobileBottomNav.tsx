"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

/** Rutas principales en móvil (el resto queda en el menú superior). */
const primaryHrefs = [
  "/dashboard",
  "/dashboard/transactions",
  "/dashboard/recurring",
  "/dashboard/installments",
  "/dashboard/profile",
];

const primaryNav = navItems.filter((item) => primaryHrefs.includes(item.href));

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/50 bg-slate-900/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          const shortLabel =
            label === "Fijos mensuales"
              ? "Fijos"
              : label === "Plazos y favores"
                ? "Plazos"
                : label;

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-violet-400"
                    : "text-slate-500 active:text-slate-300"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-violet-400")} />
                <span className="truncate">{shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
