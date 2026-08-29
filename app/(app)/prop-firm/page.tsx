import Link from "next/link";
import { Banknote, Layers, Settings, Target, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ActionList } from "@/components/prop/action-list";
import { TierLadder } from "@/components/prop/tier-ladder";
import { ScaleUpPanel } from "@/components/prop/scale-up";
import { AccountCard } from "@/components/prop/account-card";
import { PositionSizer } from "@/components/prop/position-sizer";
import type { SizerAccount } from "@/components/prop/position-sizer";
import {
  CutReference,
  ReinvestLadder,
  UpgradeLadder,
} from "@/components/prop/ladders";
import { Ledger } from "@/components/prop/ledger";
import { getAccounts } from "@/lib/data/accounts";
import { getPropEvents } from "@/lib/data/prop-events";
import { getTrades } from "@/lib/data/trades";
import { getPropReport, defaultTargetPct } from "@/lib/prop-firm";
import { FRAMEWORK, TIER_META } from "@/lib/prop-framework";

export const metadata = { title: "Prop Firm System — TradeLog" };

const money = (n: number) =>
  n >= 1000
    ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`
    : `$${Math.round(n)}`;

/**
 * The 3-Tier Framework applied to the accounts you actually hold.
 *
 * The page is ordered the way a decision is made: what to do right now, then
 * whether the portfolio is in shape, then each account, then the reference
 * tables the rules come from.
 */
export default async function PropFirmPage() {
  const [accounts, events, trades] = await Promise.all([
    getAccounts(),
    getPropEvents(),
    getTrades(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const report = getPropReport(accounts, events, trades, today);

  if (report.accounts.length === 0) {
    return (
      <>
        <PageHeader
          title="Prop Firm System"
          description="The 3-Tier Framework, applied to your accounts."
        />
        <div className="page">
          <EmptyState
            icon={Layers}
            title="No accounts in the framework yet"
            description="Add each prop account with its firm, size, and phase. Tier, cut trigger, payout lock, cycle week, and the 5:3:2 ratios are all worked out from there."
          >
            <Link
              href="/settings#account-heading"
              className="flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Add an account
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  const sizerAccounts: SizerAccount[] = report.accounts.map((g) => ({
    id: g.account.id,
    name: g.account.name,
    size: g.size,
    balance: g.balance,
    tier: g.tier,
    targetPct: defaultTargetPct(g.account.phase),
  }));

  const byTier = ([1, 2, 3] as const).map((tier) => ({
    tier,
    accounts: report.accounts.filter((a) => a.tier === tier),
  }));

  return (
    <>
      <PageHeader
        title="Prop Firm System"
        description="The 3-Tier Framework, applied to your accounts."
        actions={
          <Link
            href="/settings#account-heading"
            className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Accounts
          </Link>
        }
      />

      <div className="page">
        <section aria-labelledby="now-heading" className="card">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="now-heading"
              className="font-display text-[13px] font-bold tracking-tight text-foreground"
            >
              Do this now
            </h2>
            <span className="text-xs text-muted-foreground">
              {today} · {report.accounts.length}{" "}
              {report.accounts.length === 1 ? "account" : "accounts"} tracked
            </span>
          </div>
          <ActionList actions={report.actions} limit={6} />
        </section>

        <div className="grid-dense grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tier 1 funded"
            value={money(report.t1)}
            icon={Wallet}
            tone="neutral"
            hint={`${Math.round(report.progress.t1 * 100)}% of the ${money(FRAMEWORK.target.t1)} target`}
            emphasis
          />
          <StatCard
            label="Total deployed"
            value={money(report.deployed)}
            icon={Layers}
            tone="neutral"
            hint={report.ratioOk ? "5:3:2 holds" : "Ratios out of balance"}
          />
          <StatCard
            label="Lifetime payouts"
            value={String(report.ledger.lifetimePayouts)}
            icon={Banknote}
            tone={report.ledger.lifetimePayouts > 0 ? "profit" : "neutral"}
            hint={`${money(report.ledger.payoutTotal)} taken · ${report.ledger.payoutStreak} in a row`}
          />
          <StatCard
            label="Next payout at"
            value={`+${FRAMEWORK.payoutTriggerPct}%`}
            icon={Target}
            tone="neutral"
            hint={
              report.winRate.rate === null
                ? "No closed trades logged"
                : `Win rate ${report.winRate.rate}% over ${report.winRate.sample}`
            }
          />
        </div>

        <TierLadder report={report} />

        <ScaleUpPanel report={report} />

        {byTier.map(({ tier, accounts: list }) =>
          list.length ? (
            <section key={tier} aria-labelledby={`tier-${tier}-heading`}>
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <h2
                  id={`tier-${tier}-heading`}
                  className="font-display text-[13px] font-bold tracking-tight text-foreground"
                >
                  Tier {tier} — {TIER_META[tier].role}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {TIER_META[tier].job}
                </span>
              </div>
              <div className="grid-dense grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {list.map((g) => (
                  <AccountCard key={g.account.id} guidance={g} today={today} />
                ))}
              </div>
            </section>
          ) : null
        )}

        <PositionSizer accounts={sizerAccounts} />

        {report.actions.length > 6 ? (
          <section aria-labelledby="all-actions-heading" className="card">
            <h2
              id="all-actions-heading"
              className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground"
            >
              Everything the framework flags
            </h2>
            <ActionList actions={report.actions} />
          </section>
        ) : null}

        <div className="grid-dense grid-cols-1 lg:grid-cols-2">
          <UpgradeLadder report={report} />
          <ReinvestLadder report={report} />
        </div>

        <div className="grid-dense grid-cols-1 lg:grid-cols-2">
          <CutReference />
          <Ledger events={events} />
        </div>
      </div>
    </>
  );
}
