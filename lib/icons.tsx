import type { CSSProperties } from "react";
import {
  Briefcase,
  Car,
  Circle,
  CircleDollarSign,
  Coffee,
  CreditCard,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Plane,
  PiggyBank,
  Shirt,
  ShoppingCart,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS = [
  "utensils",
  "car",
  "home",
  "heart-pulse",
  "gamepad-2",
  "shirt",
  "graduation-cap",
  "more-horizontal",
  "briefcase",
  "laptop",
  "trending-up",
  "circle-dollar-sign",
  "shopping-cart",
  "coffee",
  "plane",
  "gift",
  "wallet",
  "credit-card",
  "piggy-bank",
  "circle",
] as const;

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  shirt: Shirt,
  "graduation-cap": GraduationCap,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  "circle-dollar-sign": CircleDollarSign,
  "shopping-cart": ShoppingCart,
  coffee: Coffee,
  plane: Plane,
  gift: Gift,
  wallet: Wallet,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  circle: Circle,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Circle;
}

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: CSSProperties;
}

export function CategoryIcon({ name, className, style }: CategoryIconProps) {
  const Icon = ICON_MAP[name] ?? Circle;
  return <Icon className={className} style={style} />;
}
