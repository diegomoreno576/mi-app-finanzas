import type { CSSProperties } from "react";
import { icons, type LucideIcon } from "lucide-react";

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

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function getCategoryIcon(name: string): LucideIcon {
  const pascal = toPascalCase(name);
  const Icon = icons[pascal as keyof typeof icons];
  return Icon ?? icons.Circle;
}

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: CSSProperties;
}

export function CategoryIcon({ name, className, style }: CategoryIconProps) {
  const Icon = getCategoryIcon(name);
  return <Icon className={className} style={style} />;
}
