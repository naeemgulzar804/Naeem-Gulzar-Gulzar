import Link from "next/link";
import { FRAMEWORK } from "@/lib/prop-framework";
import type { AccountGuidance, AccountStatus } from "@/lib/prop-firm";
import { AccountActions } from "@/components/prop/account-actions";
import { cn } from "@/lib/utils";

const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

const STATUS: Record<AccountStatus, { label: string; cls: string }> = {
  "cut-now": { label: "Cut now", cls: "bg-loss text-loss-foreground" },
  "payout-ready": { label: "Payout ready", cls: "bg-profit text-profit-foreground" },
  danger: { label: "Near the cut", cls: "bg-loss/15 text-loss" },
  watch: { label: "Watch", cls: "bg-amber-500/15 text-amber-500" },
  resting: { label: "Rest week", cls: "bg-secondary text-muted-foreground" },
  healthy: { label: "Healthy", cls: "bg-profit/12 text-profit" },
};

const TIER_CLS: Record<number, string> = {
  1: "bg-profit/15 text-profit",
  2: "bg-accent-soft text-accent",
  3: "bg-[var(--chart-4)]/15 text-[var(--chart-4)]",
};

function Meter({
  label,
  value,
  progress,
  tone,
}: {
  label: string;
  value: string;
  progress: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="figure text-[11px] font-semibold text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
    </div>
  );
}

/** The five-week cycle as five blocks, with the current week filled. */
function CycleStrip({ weekIndex, onWeek }: { weekIndex: number; onWeek: boolean }) {
  const weeks = FRAMEWORK.cycleOnWeeks + FRAMEWORK.cycleOffWeeks;
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: weeks }, (_, i) => {
        const rest = i >= FRAMEWORK.cycleOnWeeks;
        const now = i === weekIndex;
        return (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              now
                ? onWeek
                  ? "bg-profit"
                  : "bg-amber-500"
                : rest
                  ? "bg-secondary"
                  : "bg-border-strong"
            )}
          />
        );
      })}
    </div>
  );
}

export function AccountCard({
  guidance,
  today,
}: {
  guidance: AccountGuidance;
  today: string;
}) {
  const g = guidance;
  const status = STATUS[g.status];
  const cutTone =
    g.cutProgress >= 1
      ? "bg-loss"
      : g.cutProgress >= 2 / 3
        ? "bg-loss/70"
        : g.cutProgress >= 1 / 3
          ? "bg-amber-500"
          : "bg-profit";

  return (
    <article
      className={cn(
        "card flex flex-col",
        g.status === "cut-now" && "border-loss/40",
        g.status === "payout-ready" && "border-profit/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                TIER_CLS[g.tier]
              )}
            >
              {g.tier}
            </span>
            <h3 className="truncate text-sm font-semibold text-foreground">
              {g.account.name}
            </h3>
          </div>
          <p className="mt-1 truncate text-[11px] text-faint">
            {[g.account.firm, g.phaseLabel, money(g.size)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            status.cls
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="figure text-[20px] font-bold leading-none text-foreground">
          {money(g.balance)}
        </span>
        <span
          className={cn(
            "figure text-xs font-semibold",
            g.pnl > 0 ? "text-profit" : g.pnl < 0 ? "text-loss" : "text-muted-foreground"
          )}
        >
          {g.pnl >= 0 ? "+" : ""}
          {g.pnlPct.toFixed(2)}%
        </span>
      </div>
      <p className="mt-1 text-[11px] text-faint">
        {g.derived
          ? `From ${g.loggedTrades} logged ${g.loggedTrades === 1 ? "trade" : "trades"}`
          : "Manually set balance"}
        {g.account.drawdownBasis === "peak" ? " · trailing drawdown" : ""}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <Meter
          label={`To the −${g.cutPct}% cut`}
          value={g.roomToCut > 0 ? `${money(g.roomToCut)} left` : "Trigger hit"}
          progress={g.cutProgress}
          tone={cutTone}
        />
        {g.payoutProgress !== null ? (
          <Meter
            label={`To the +${FRAMEWORK.payoutTriggerPct}% payout`}
            value={
              (g.roomToPayout ?? 0) > 0
                ? `${money(g.roomToPayout ?? 0)} to go`
                : "Lock it in"
            }
            progress={g.payoutProgress}
            tone="bg-profit"
          />
        ) : null}
      </div>

      {g.cycle ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {g.cycle.label}
            </span>
            <span className="text-[11px] text-faint">
              {g.cycle.pending
                ? `from ${g.account.cycleStart}`
                : `${g.cycle.daysUntilSwitch}d`}
            </span>
          </div>
          <CycleStrip weekIndex={g.cycle.weekIndex} onWeek={g.cycle.onWeek} />
        </div>
      ) : null}

      {g.actions.length ? (
        <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
          {g.actions.map((a, i) => (
            <li key={i} className="text-[12px] leading-relaxed">
              <span
                className={cn(
                  "font-semibold",
                  a.tone === "critical"
                    ? "text-loss"
                    : a.tone === "good"
                      ? "text-profit"
                      : a.tone === "warn"
                        ? "text-amber-500"
                        : "text-foreground"
                )}
              >
                {a.title}.
              </span>{" "}
              <span className="text-muted-foreground">{a.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto">
        <AccountActions
          accountId={g.account.id}
          accountLabel={g.account.name}
          phase={g.account.phase}
          suggestedPayout={(g.size * FRAMEWORK.payoutTriggerPct) / 100}
          today={today}
        />
        <Link
          href="/settings#account-heading"
          className="mt-2 inline-block rounded text-[11px] text-faint underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Edit account
        </Link>
      </div>
    </article>
  );
}
