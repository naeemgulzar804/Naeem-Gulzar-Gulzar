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
        "rounded-2xl border p-5",
        emphasis
          ? "border-accent-border bg-accent-soft"
          : "border-border bg-card"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          emphasis ? "bg-accent text-on-accent" : "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      <p
        className={cn(
          "tabular mt-4 font-display font-bold leading-none tracking-tight",
          emphasis ? "text-[34px]" : "text-[28px]",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>

      <p className="mt-2.5 text-[13px] font-medium text-muted-foreground">
        {label}
      </p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
