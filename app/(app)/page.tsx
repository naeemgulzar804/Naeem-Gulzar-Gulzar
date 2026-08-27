import Link from "next/link";
import {
  Award,
  DollarSign,
  Flame,
  Hash,
  LineChart,
  Percent,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { WinRateDonut, WinRateBarChart } from "@/components/analytics-charts";
import { TradeTable } from "@/components/trade-table";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";
import { getStats, getEquityCurve, groupWinRate } from "@/lib/analytics";
import { ENTRY_TIMES, WEEKDAYS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const trades = await getTrades();

  if (trades.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Your trading performance at a glance."
        />
        <div className="flex-1 px-4 py-6 sm:px-8">
          <EmptyState
            icon={LineChart}
            title="No trades yet"
            description="Log your first trade to see your stats here, or load sample data to explore the app."
          >
            <Link
              href="/trades/new"
              className="flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a trade
            </Link>
            <SeedDemoButton />
          </EmptyState>
        </div>
      </>
    );
  }

  const stats = getStats(trades);
  const equityCurve = getEquityCurve(trades);
  const recentTrades = trades.slice(0, 8);

  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const breakEven = trades.filter((t) => t.result === "Break Even").length;
  const aPlus = groupWinRate(trades, "grade", "A+");

  const bestSetup = (["A+", "A", "B", "C"] as const)
    .map((g) => ({ grade: g, stat: groupWinRate(trades, "grade", g) }))
    .filter((x) => x.stat)
    .sort((a, b) => (b.stat!.rate ?? 0) - (a.stat!.rate ?? 0))[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your trading performance at a glance."
      />

      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Net P&L"
            value={formatCurrency(stats.netPnl)}
            icon={DollarSign}
            tone={stats.netPnl >= 0 ? "profit" : "loss"}
            hint={`${stats.totalTrades} trades logged`}
            emphasis
          />
          <StatCard
            label="Win rate"
            value={formatPercent(stats.winRate)}
            icon={Target}
            tone="neutral"
            hint={`${wins}W · ${losses}L${breakEven ? ` · ${breakEven} BE` : ""}`}
          />
          <StatCard
            label="Profit factor"
            value={stats.profitFactor.toFixed(2)}
            icon={Zap}
            tone={stats.profitFactor >= 1.5 ? "profit" : "neutral"}
            hint="Gross profit / gross loss"
          />
          <StatCard
            label="Avg R multiple"
            value={`${stats.avgR >= 0 ? "+" : ""}${stats.avgR.toFixed(2)}R`}
            icon={Percent}
            tone={stats.avgR >= 0 ? "profit" : "loss"}
            hint="Across all trades"
          />
          <StatCard
            label="A+ win rate"
            value={aPlus ? formatPercent(aPlus.rate) : "—"}
            icon={Award}
            tone={aPlus && aPlus.rate >= 50 ? "profit" : "neutral"}
            hint={aPlus ? `${aPlus.count} A+ trades` : "No A+ trades yet"}
          />
          <StatCard
            label="Current streak"
            value={String(stats.currentStreak.count || "—")}
            icon={Flame}
            tone={stats.currentStreak.type === "win" ? "profit" : "loss"}
            hint={
              stats.currentStreak.count
                ? `${stats.currentStreak.type} streak`
                : "No closed trades"
            }
          />
          <StatCard
            label="Best setup"
            value={bestSetup?.grade ?? "—"}
            icon={Hash}
            tone="neutral"
            hint={
              bestSetup?.stat
                ? `${bestSetup.stat.rate}% over ${bestSetup.stat.count} trades`
                : "Log more trades"
            }
          />
          <StatCard
            label="Total trades"
            value={String(stats.totalTrades)}
            icon={LineChart}
            tone="neutral"
            hint="All sessions"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Equity curve</h2>
              <span className="text-xs text-muted-foreground">
                Starting balance {formatCurrency(50000)}
              </span>
            </div>
            <EquityCurveChart data={equityCurve} />
          </div>
          <WinRateDonut wins={wins} losses={losses} breakEven={breakEven} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Win rate by day
            </h2>
            <WinRateBarChart
              data={WEEKDAYS.map((d) => ({
                label: d.slice(0, 3),
                stat: groupWinRate(trades, "day", d),
              }))}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Entry time performance
            </h2>
            <WinRateBarChart
              data={ENTRY_TIMES.map((t) => ({
                label: t,
                stat: groupWinRate(trades, "entryTime", t),
              }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Averages</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-profit" aria-hidden="true" />
                  Avg win
                </dt>
                <dd className="tabular font-medium text-profit">
                  {formatCurrency(stats.avgWin)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-loss" aria-hidden="true" />
                  Avg loss
                </dt>
                <dd className="tabular font-medium text-loss">
                  -{formatCurrency(stats.avgLoss)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Best / worst day
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {stats.bestDay ? stats.bestDay.date : "—"}
                </dt>
                <dd className="tabular font-medium text-profit">
                  {stats.bestDay ? formatCurrency(stats.bestDay.pnl) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {stats.worstDay ? stats.worstDay.date : "—"}
                </dt>
                <dd className="tabular font-medium text-loss">
                  {stats.worstDay ? formatCurrency(stats.worstDay.pnl) : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent trades</h2>
            <Link
              href="/trades"
              className="rounded text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all
            </Link>
          </div>
          <TradeTable trades={recentTrades} caption="Most recent 8 trades" />
        </div>
      </div>
    </>
  );
}
