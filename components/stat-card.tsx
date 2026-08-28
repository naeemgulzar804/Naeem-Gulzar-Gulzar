import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * Composition follows the reference template's stat tiles: a rounded icon chip
 * on its own line, then the value at display weight, then a muted caption.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "profit" | "loss" | "neutral";
  hint?: string;
  /** Promotes a headline metric so a grid of tiles isn't uniformly flat. */
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "card",
        emphasis
          ? "border-accent-border bg-accent-soft"
          : "border-border bg-card"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          emphasis ? "bg-accent text-on-accent" : "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>

      <p
        className={cn(
          "figure mt-2.5 font-bold leading-none",
          emphasis ? "text-[20px] sm:text-[26px]" : "text-[18px] sm:text-[22px]",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>

      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}
