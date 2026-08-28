import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { RiskReport } from "@/lib/risk";
import { cn } from "@/lib/utils";

/**
 * Distance-to-breach, not raw P&L. On a funded account the number that
 * decides whether you can keep trading today is how much of each limit is
 * already spent.
 */
export function RiskGuardrails({ report }: { report: RiskReport }) {
  if (report.guardrails.length === 0) return null;

  const anyBreached = report.guardrails.some((g) => g.breached);

  return (
    <section
      aria-labelledby="guardrails-heading"
      className="card"
    >
      <div className="mb-4 flex items-center gap-2">
        {anyBreached ? (
          <AlertTriangle className="h-4 w-4 text-loss" aria-hidden="true" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-profit" aria-hidden="true" />
        )}
        <h2
          id="guardrails-heading"
          className="font-display text-[13px] font-bold tracking-tight text-foreground"
        >
          Account limits
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {report.guardrails.map((g) => {
          const pct = Math.min(Math.max(g.used, 0), 1) * 100;
          // A limit is a warning as it fills; a target is a good thing to fill.
          const tone = g.positive
            ? "bg-profit"
            : g.breached
              ? "bg-loss"
              : g.used >= 0.75
                ? "bg-amber-500"
                : "bg-accent";

          return (
            <div key={g.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {g.label}
                </span>
                <span
                  className={cn(
                    "figure text-xs font-semibold",
                    g.breached ? "text-loss" : "text-foreground"
                  )}
                >
                  {Math.round(g.used * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full", tone)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-faint">
                {g.usedLabel} {g.limitLabel}
              </p>
            </div>
          );
        })}
      </div>

      {report.overtradedDays.length ? (
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          You kept trading past your own stop-loss-count rule on{" "}
          <span className="font-semibold">
            {report.overtradedDays.length}{" "}
            {report.overtradedDays.length === 1 ? "day" : "days"}
          </span>
          , most recently {report.overtradedDays[0].date} (
          {report.overtradedDays[0].losses} losses).
        </p>
      ) : null}
    </section>
  );
}
