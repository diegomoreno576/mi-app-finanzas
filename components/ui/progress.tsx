import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
}: ProgressProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-slate-700",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", indicatorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
