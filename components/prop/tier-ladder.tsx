import { TIER_META } from "@/lib/prop-framework";
import type { PropReport } from "@/lib/prop-firm";
import { cn } from "@/lib/utils";

const money = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

const BAR: Record<number, string> = {
  1: "bg-profit",
  2: "bg-[var(--chart-1)]",
  3: "bg-[var(--chart-4)]",
};

const DOT: Record<number, string> = {
  1: "bg-profit/15 text-profit",
  2: "bg-accent-soft text-accent",
  3: "bg-[var(--chart-4)]/15 text-[var(--chart-4)]",
};

/**
 * The 5:3:2 split, shown as what it actually is: a floor T2 and T3 have to
 * clear, not a pie chart. The bar is the current split; the row beneath each
 * tier is the gap to the framework's required ratio.
 */
export function TierLadder({ report }: { report: PropReport }) {
  const { tiers, deployed } = report;

  return (
    <section aria-labelledby="tier-split" className="card">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="tier-split"
          className="font-display text-[13px] font-bold tracking-tight text-foreground"
        >
          Tier split
        </h2>
        <span className="text-xs text-muted-foreground">
          {money(deployed)} deployed ·{" "}
          <span className={report.ratioOk ? "text-profit" : "text-amber-500"}>
            {report.ratioOk ? "ratios hold" : "ratios out of balance"}
          </span>
        </span>
      </div>

      {deployed > 0 ? (
        <div
          className="mb-4 flex h-9 overflow-hidden rounded-xl border border-border"
          role="img"
          aria-label={tiers
            .map((t) => `Tier ${t.tier} ${money(t.capital)}`)
            .join(", ")}
        >
          {tiers
            .filter((t) => t.capital > 0)
            .map((t) => (
              <div
                key={t.tier}
                className={cn(
                  "flex items-center justify-center overflow-hidden",
                  BAR[t.tier]
                )}
                style={{ width: `${t.share * 100}%` }}
              >
                <span className="figure whitespace-nowrap px-2 text-[11px] font-semibold text-white">
                  T{t.tier} · {Math.round(t.share * 100)}%
                </span>
              </div>
            ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiers.map((t) => {
          const meta = TIER_META[t.tier];
          const short = t.gap > 0;
          return (
            <div key={t.tier} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    DOT[t.tier]
                  )}
                >
                  {t.tier}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {meta.role}
                </span>
              </div>
              <p className="figure mt-2 text-[18px] font-bold leading-none text-foreground">
                {money(t.capital)}
              </p>
              <p className="mt-1 text-[11px] text-faint">
                {t.accounts} {t.accounts === 1 ? "account" : "accounts"}
                {t.required === null
                  ? " · sets the ratio"
                  : t.required > 0
                    ? ` · needs ${money(t.required)}`
                    : " · no T1 to measure against"}
              </p>
              {short ? (
                <p className="mt-1.5 text-[11px] font-semibold text-amber-500">
                  {money(t.gap)} short
                </p>
              ) : t.required ? (
                <p className="mt-1.5 text-[11px] font-semibold text-profit">
                  Fully stocked
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
