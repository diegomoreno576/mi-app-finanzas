"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { navItems } from "@/components/dashboard/nav-items";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer =
    open && mounted
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <nav
              className="fixed inset-y-0 right-0 z-[201] flex w-[min(100vw-2.5rem,17.5rem)] flex-col gap-1 overflow-y-auto border-l border-slate-700/50 bg-slate-900 p-4 pt-[calc(3.75rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-2xl lg:hidden"
              aria-label="Menú de navegación"
            >
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                Menú
              </p>
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
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-violet-600/20 text-violet-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-auto border-t border-slate-700/50 pt-4">
                <InstallAppButton variant="sidebar" />
              </div>
            </nav>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-3 py-2.5 sm:px-4 sm:py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">Mi Finanzas</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative z-[202] rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>
      {drawer}
    </>
  );
}
