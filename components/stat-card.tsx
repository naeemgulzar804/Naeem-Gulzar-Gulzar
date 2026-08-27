import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "profit" && "text-profit",
            tone === "loss" && "text-loss",
            tone === "neutral" && "text-faint"
          )}
          aria-hidden="true"
        />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p
        className={cn(
          "tabular mt-3 font-display font-semibold",
          emphasis ? "text-[30px] leading-none" : "text-2xl leading-none",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
