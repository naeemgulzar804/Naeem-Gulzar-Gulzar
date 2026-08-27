import { TrendingDown, TrendingUp } from "lucide-react";
import type { PatternReport } from "@/lib/patterns";
import { MIN_SAMPLE, MIN_LIFT } from "@/lib/patterns";
import type { TradePattern } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Renders a pattern report as two tiers. Kept apart from the page so the
 * layout can be exercised against a fixed report without a database.
 */
export function PatternTiers({ report }: { report: PatternReport }) {
  const hasConfirmed = report.edges.length + report.leaks.length > 0;
  const hasProvisional = report.watchEdges.length + report.watchLeaks.length > 0;

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Checked{" "}
          <span className="tabular font-semibold text-foreground">
            {report.hypothesesTested}
          </span>{" "}
          different slices of your {report.closedCount} closed trades against
          your baseline win rate of{" "}
          <span className="tabular font-semibold text-foreground">
            {report.baselineRate}%
          </span>
          . A group has to hold at least {MIN_SAMPLE} trades and sit at least{" "}
          {MIN_LIFT} points off that baseline before it shows up here at all.
        </p>
        <p className="mt-2.5 text-xs text-faint">
          Slicing a history this many ways will always throw up something that
          looks like an edge, so findings are split into two tiers below — and
          the bar for the top one gets stricter the more slices there are to
          check.
        </p>
      </div>

      <section aria-labelledby="confirmed-heading" className="space-y-4">
        <div>
          <h2
            id="confirmed-heading"
            className="font-display text-lg font-bold tracking-tight text-foreground"
          >
            Confirmed
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Strong enough to survive the number of slices checked. These are
            worth changing how you trade over.
          </p>
        </div>

        {hasConfirmed ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <PatternColumn
              title="What's working"
              icon={TrendingUp}
              tone="profit"
              emptyLabel="No group is beating your baseline by enough to confirm an edge."
              patterns={report.edges}
              baseline={report.baselineRate}
            />
            <PatternColumn
              title="What's costing you"
              icon={TrendingDown}
              tone="loss"
              emptyLabel="Nothing is underperforming by a confirmed margin."
              patterns={report.leaks}
              baseline={report.baselineRate}
            />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground sm:p-6">
            Nothing confirmed yet. That is the normal result at{" "}
            {report.closedCount} trades — proving an edge past this many
            comparisons usually takes a few hundred. Anything suggestive is
            listed below instead.
          </p>
        )}
      </section>

      {hasProvisional ? (
        <section aria-labelledby="watch-heading" className="space-y-4">
          <div>
            <h2
              id="watch-heading"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              Worth watching
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              These clear an ordinary significance test but not the stricter one
              above.{" "}
              <span className="text-foreground">
                Treat them as questions, not conclusions
              </span>{" "}
              — on a history with no real edges at all, roughly one of these
              still shows up about half the time. Keep logging and they either
              harden or disappear.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <PatternColumn
              title="Possible edges"
              icon={TrendingUp}
              tone="profit"
              provisional
              emptyLabel="Nothing above your baseline to watch right now."
              patterns={report.watchEdges}
              baseline={report.baselineRate}
            />
            <PatternColumn
              title="Possible leaks"
              icon={TrendingDown}
              tone="loss"
              provisional
              emptyLabel="Nothing below your baseline to watch right now."
              patterns={report.watchLeaks}
              baseline={report.baselineRate}
            />
          </div>
        </section>
      ) : null}
    </>
  );
}

function PatternColumn({
  title,
  icon: Icon,
  tone,
  emptyLabel,
  patterns,
  baseline,
  provisional = false,
}: {
  title: string;
  icon: typeof TrendingUp;
  tone: "profit" | "loss";
  emptyLabel: string;
  patterns: TradePattern[];
  baseline: number;
  provisional?: boolean;
}) {
  const isEdge = tone === "profit";
  const headingId = `${provisional ? "watch" : "confirmed"}-${tone}-heading`;

  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold tracking-tight text-foreground"
      >
        <Icon
          className={cn("h-4 w-4", isEdge ? "text-profit" : "text-loss")}
          aria-hidden="true"
        />
        {title}
      </h3>

      {patterns.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-3">
          {patterns.map((p) => (
            <li
              key={p.id}
              className={cn(
                "rounded-2xl border p-4 sm:p-5",
                provisional
                  ? "border-dashed border-border bg-card/50"
                  : "border-border bg-card"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {p.title}
                  </p>
                  {p.detail ? (
                    <p className="mt-0.5 text-xs text-faint">{p.detail}</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "tabular shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    isEdge ? "bg-profit/12 text-profit" : "bg-loss/12 text-loss"
                  )}
                >
                  {p.lift > 0 ? "+" : ""}
                  {p.lift} pts
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(p.rate, 100)}%`,
                      background: isEdge
                        ? "var(--color-profit)"
                        : "var(--color-loss)",
                      opacity: provisional ? 0.55 : 1,
                    }}
                  />
                </div>
                <span className="tabular shrink-0 text-xs font-semibold text-foreground">
                  {p.rate}%
                </span>
              </div>

              <p className="mt-2 text-xs text-faint">
                {p.sampleSize} trades · vs {baseline}% baseline
                {provisional && p.moreTradesNeeded
                  ? ` · needs about ${p.moreTradesNeeded} more like it to confirm`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
