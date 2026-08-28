import type { Expectancy, RBucket } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const R = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;

/**
 * Expectancy answers the question win rate can't: is the model paying? With a
 * fixed 1:3 target, 45% winners is excellent and 45% winners that get cut at
 * 1R is a slow bleed — same win rate, opposite outcome.
 */
export function ExpectancyPanel({ expectancy }: { expectancy: Expectancy }) {
  const positive = expectancy.perTrade >= 0;

  return (
    <div className="card">
      <h2 className="mb-1 font-display text-[13px] font-bold tracking-tight text-foreground">
        Expectancy
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        What one trade is worth on average, over {expectancy.sampleSize} closed
        trades.
      </p>

      <p
        className={cn(
          "figure text-[26px] font-bold leading-none",
          positive ? "text-profit" : "text-loss"
        )}
      >
        {R(expectancy.perTrade)}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {formatCurrency(expectancy.perTradeCurrency)} per trade
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <div>
          <dt className="text-xs text-muted-foreground">Win rate</dt>
          <dd className="figure mt-0.5 text-sm font-semibold text-foreground">
            {expectancy.winRate}%
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Avg win</dt>
          <dd className="figure mt-0.5 text-sm font-semibold text-profit">
            {R(expectancy.avgWinR)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Avg loss</dt>
          <dd className="figure mt-0.5 text-sm font-semibold text-loss">
            {R(expectancy.avgLossR)}
          </dd>
        </div>
      </dl>

      {expectancy.avgWinR > 0 && expectancy.avgWinR < 2 ? (
        <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          Your average winner is {R(expectancy.avgWinR)} against a 1:3 target.
          Winners are being closed well short of the plan.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Where the winners actually land. A pile at +1R against a 1:3 target is the
 * clearest sign of cutting trades early, and average R hides it completely.
 */
export function RDistribution({ buckets }: { buckets: RBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="card">
      <h2 className="mb-1 font-display text-[13px] font-bold tracking-tight text-foreground">
        Where trades finish
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        {total} closed trades by realized R. With a 1:3 target, winners should
        cluster at the right.
      </p>

      <ul className="space-y-2">
        {buckets.map((b) => (
          <li key={b.label} className="flex items-center gap-3">
            <span className="figure w-20 shrink-0 text-xs text-muted-foreground">
              {b.label}
            </span>
            <span className="h-5 flex-1 overflow-hidden rounded-md bg-secondary">
              <span
                className={cn(
                  "block h-full rounded-md",
                  b.kind === "win" ? "bg-profit" : "bg-loss"
                )}
                style={{ width: `${(b.count / max) * 100}%` }}
              />
            </span>
            <span className="figure w-8 shrink-0 text-right text-xs font-semibold text-foreground">
              {b.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
