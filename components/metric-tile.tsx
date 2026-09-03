import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Headline tile for the dashboard's top row: label, figure, and a meter that
 * carries the shape of the number.
 *
 * It sits beside the existing StatCard rather than replacing it. StatCard is
 * the dense icon tile used for secondary metrics; this one is deliberately
 * taller and reserved for the handful of figures a trader opens the app to
 * check, so the row has a clear focal band instead of eight equal tiles.
 */
export function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
  visual,
  footer,
  className,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: "profit" | "loss" | "neutral";
  /** Meter rendered to the right of the figure. */
  visual?: ReactNode;
  /** Full-width meter below the figure, for bars that need the whole card. */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col justify-between", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "figure text-[20px] font-bold leading-none sm:text-[24px]",
              tone === "profit" && "text-profit",
              tone === "loss" && "text-loss",
              tone === "neutral" && "text-foreground"
            )}
          >
            {value}
          </p>
          {hint ? (
            <div className="mt-1.5 text-[11px] text-faint">{hint}</div>
          ) : null}
        </div>

        {visual ? <div className="shrink-0">{visual}</div> : null}
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
