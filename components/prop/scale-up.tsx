import { Check, Lock, X } from "lucide-react";
import { SPEND_PRIORITY } from "@/lib/prop-framework";
import type { PropReport } from "@/lib/prop-firm";
import { cn } from "@/lib/utils";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * The two decisions the framework gates: where the next dollar goes, and
 * whether T1 is allowed to grow at all. Both are shown as pass/fail against
 * the rule rather than as advice, because both are hard gates.
 */
export function ScaleUpPanel({ report }: { report: PropReport }) {
  const { stage, nextSpend, scaleUp, scaleUpReady } = report;
  const activeStep = SPEND_PRIORITY.findIndex((s) =>
    s.toLowerCase().startsWith(nextSpend.step.toLowerCase().slice(0, 9))
  );

  return (
    <div className="grid-dense grid-cols-1 lg:grid-cols-2">
      <section aria-labelledby="spend-heading" className="card">
        <h2
          id="spend-heading"
          className="font-display text-[13px] font-bold tracking-tight text-foreground"
        >
          Where the next payout goes
        </h2>

        <div className="mt-3 rounded-xl border border-accent-border bg-accent-soft p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            Next
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {nextSpend.step}
            {nextSpend.amount !== null ? ` — ${money(nextSpend.amount)}` : ""}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {nextSpend.detail}
          </p>
        </div>

        <ol className="mt-3 flex flex-col gap-1.5">
          {SPEND_PRIORITY.map((step, i) => {
            const done = activeStep >= 0 && i < activeStep;
            const now = i === activeStep;
            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px]",
                  now ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    now
                      ? "bg-accent text-on-accent"
                      : done
                        ? "bg-profit/15 text-profit"
                        : "bg-secondary text-faint"
                  )}
                >
                  {done ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
                </span>
                {step}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Stage {stage.stage} — {stage.name}
            </p>
            <p className="mt-0.5 text-[11px] text-faint">{stage.priority}</p>
          </div>
          <div className="text-right">
            <p className="figure text-sm font-bold text-foreground">
              {stage.reinvestPct}% in
            </p>
            <p className="text-[11px] text-faint">
              {report.personalIncomeUnlocked
                ? `${100 - stage.reinvestPct}% take home`
                : "0% take home — pipeline first"}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="scaleup-heading" className="card">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="scaleup-heading"
            className="font-display text-[13px] font-bold tracking-tight text-foreground"
          >
            T1 scale-up gate
          </h2>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              scaleUpReady
                ? "bg-profit/15 text-profit"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {scaleUpReady ? (
              <Check className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Lock className="h-3 w-3" aria-hidden="true" />
            )}
            {scaleUpReady ? "Clear to add funding" : "Locked"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          All five must be true before a dollar goes into new T1 funding.
        </p>

        <ul className="mt-3 flex flex-col">
          {scaleUp.map((c) => (
            <li
              key={c.label}
              className="flex items-start gap-2.5 border-b border-border py-2 last:border-b-0"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  c.ok ? "bg-profit/15 text-profit" : "bg-loss/12 text-loss"
                )}
              >
                {c.ok ? (
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                ) : (
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-foreground">{c.label}</p>
                <p className="text-[11px] text-faint">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
