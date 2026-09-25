import {
  LayoutDashboard,
  Tags,
  PiggyBank,
  User,
  CalendarClock,
  Layers,
  HeartPulse,
  ArrowLeftRight,
  TrendingUp,
  Scale,
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
  { href: "/dashboard/decisions", label: "Decisiones", icon: Scale },
  { href: "/dashboard/investments", label: "Inversiones", icon: TrendingUp },
  { href: "/dashboard/categories", label: "Categorías", icon: Tags },
  { href: "/dashboard/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
];
