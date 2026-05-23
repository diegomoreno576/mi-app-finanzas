"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wallet, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white">Mi Finanzas</span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed right-0 top-0 z-50 flex h-full w-64 flex-col gap-1 border-l border-slate-700/50 bg-slate-900 p-4 pt-16">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-600/20 text-violet-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </header>
  );
}
