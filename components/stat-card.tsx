import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "profit" | "loss" | "neutral";
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "profit" && "bg-profit/15 text-profit",
            tone === "loss" && "bg-loss/15 text-loss",
            tone === "neutral" && "bg-secondary text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold tracking-tight",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
