import type { DisciplineRate } from "@/lib/risk";
import { cn } from "@/lib/utils";

/**
 * Discipline is measured separately from results on purpose: following the
 * model and making money are different questions, and a profitable month of
 * rule-breaking is the most dangerous outcome there is.
 */
export function DisciplinePanel({ rates }: { rates: DisciplineRate[] }) {
  const measured = rates.filter((r) => r.rate !== null);

  return (
    <div className="card">
      <h2 className="mb-1 font-display text-[13px] font-bold tracking-tight text-foreground">
        Rule adherence
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Whether you followed the model — a separate question from whether the
        trades won.
      </p>

      {measured.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nothing measured yet. These fill in as you log trades with the new
          criteria recorded.
        </p>
      ) : (
        <ul className="space-y-4">
          {rates.map((r) => (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-foreground">{r.label}</span>
                <span
                  className={cn(
                    "figure shrink-0 text-sm font-semibold",
                    r.rate === null
                      ? "text-faint"
                      : r.rate >= 80
                        ? "text-profit"
                        : r.rate >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-loss"
                  )}
                >
                  {r.rate === null ? "—" : `${r.rate}%`}
                </span>
              </div>
              {r.rate !== null ? (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      r.rate >= 80
                        ? "bg-profit"
                        : r.rate >= 50
                          ? "bg-amber-500"
                          : "bg-loss"
                    )}
                    style={{ width: `${r.rate}%` }}
                  />
                </div>
              ) : null}
              <p className="mt-1 text-xs text-faint">
                {r.detail}{" "}
                {r.rate === null
                  ? "Not recorded on any trade yet."
                  : `Over ${r.recorded} ${r.recorded === 1 ? "trade" : "trades"} where it was recorded.`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
