import {
  LayoutDashboard,
  Tags,
  PiggyBank,
  User,
  CalendarClock,
  Layers,
  HeartPulse,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/movements", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/dashboard/recurring", label: "Fijos mensuales", icon: CalendarClock },
  { href: "/dashboard/installments", label: "Plazos y favores", icon: Layers },
  { href: "/dashboard/health", label: "Salud", icon: HeartPulse },
  { href: "/dashboard/categories", label: "Categorías", icon: Tags },
  { href: "/dashboard/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
];
