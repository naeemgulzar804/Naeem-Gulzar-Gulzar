import Link from "next/link";
import {
  Award,
  Flame,
  Hash,
  LineChart,
  Percent,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { MetricTile } from "@/components/metric-tile";
import {
  DivergingBar,
  GaugeArc,
  RingMeter,
} from "@/components/metric-visuals";
import { ScoreRadar } from "@/components/score-radar";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { DailyPnlChart } from "@/components/daily-pnl-chart";
import { WinRateDonut, WinRateBarChart } from "@/components/analytics-charts";
import { TradeTable } from "@/components/trade-table";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { RiskGuardrails } from "@/components/risk-guardrails";
import { getTrades } from "@/lib/data/trades";
import { getAccounts } from "@/lib/data/accounts";
import { ViewFilters } from "@/components/view-filters";
import { parseFilters, type SearchParams } from "@/lib/filters";
import { getAccountSettings } from "@/lib/data/accounts";
import {
  getDailyPnl,
  getEquityCurve,
  getStats,
  groupWinRate,
} from "@/lib/analytics";
import { getRiskReport } from "@/lib/risk";
import { getTradingScore } from "@/lib/score";
import { ENTRY_TIMES, WEEKDAYS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const accounts = await getAccounts();
  const [trades, settings] = await Promise.all([
    getTrades(filters),
    getAccountSettings(filters.accountId),
  ]);

  if (trades.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Your trading performance at a glance."
        actions={<ViewFilters accounts={accounts} />}
      />
        <div className="page">
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
  const equityCurve = getEquityCurve(trades, settings.startingBalance);
  const dailyPnl = getDailyPnl(trades);
  const today = new Date().toISOString().slice(0, 10);
  const risk = getRiskReport(trades, settings, today);
  const recentTrades = trades.slice(0, 8);
  const score = getTradingScore(trades, settings.startingBalance, stats);

  // Open the calendar on the most recent month that actually has trades.
  const latestMonth = dailyPnl.length
    ? dailyPnl[dailyPnl.length - 1].date.slice(0, 7)
    : today.slice(0, 7);

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
      actions={<ViewFilters accounts={accounts} />}
      />

      <div className="page">
        <RiskGuardrails report={risk} />

        {/*
          The focal band. These five are what the app gets opened to check, so
          each one carries a meter: the figure says how much, the meter says
          whether that is healthy, without needing a benchmark in your head.
        */}
        <div className="grid-dense grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
          <MetricTile
            label="Net P&L"
            value={formatCurrency(stats.netPnl)}
            tone={stats.netPnl >= 0 ? "profit" : "loss"}
            hint={`${stats.totalTrades} trades logged`}
            className={
              stats.netPnl >= 0
                ? "border-accent-border bg-accent-soft"
                : undefined
            }
          />

          <MetricTile
            label="Trade win %"
            value={formatPercent(stats.winRate)}
            hint={
              <span className="flex flex-wrap items-center gap-x-2">
                <span className="text-profit">{wins}W</span>
                {breakEven ? <span>{breakEven} BE</span> : null}
                <span className="text-loss">{losses}L</span>
              </span>
            }
            visual={
              <GaugeArc
                segments={[
                  { value: wins, className: "stroke-profit", label: "Wins" },
                  {
                    value: breakEven,
                    className: "stroke-accent",
                    label: "Break even",
                  },
                  { value: losses, className: "stroke-loss", label: "Losses" },
                ]}
              />
            }
          />

          <MetricTile
            label="Avg win / loss trade"
            value={
              stats.avgLoss > 0
                ? (stats.avgWin / stats.avgLoss).toFixed(2)
                : "—"
            }
            hint={
              <span className="flex items-center justify-between gap-2">
                <span className="text-profit">
                  {formatCurrency(stats.avgWin)}
                </span>
                <span className="text-loss">
                  -{formatCurrency(stats.avgLoss)}
                </span>
              </span>
            }
            footer={<DivergingBar win={stats.avgWin} loss={stats.avgLoss} />}
          />

          <MetricTile
            label="Profit factor"
            value={stats.profitFactor.toFixed(2)}
            tone={stats.profitFactor >= 1.5 ? "profit" : "neutral"}
            hint="Target 2.00"
            visual={
              <RingMeter
                value={stats.profitFactor}
                target={2}
                tone={stats.profitFactor >= 1.5 ? "profit" : "accent"}
              />
            }
          />

          <MetricTile
            label="Current streak"
            value={String(stats.currentStreak.count || "—")}
            tone={
              stats.currentStreak.count
                ? stats.currentStreak.type === "win"
                  ? "profit"
                  : "loss"
                : "neutral"
            }
            hint={
              stats.currentStreak.count
                ? `${stats.currentStreak.type} streak`
                : "No closed trades"
            }
            visual={
              <Flame
                className={
                  stats.currentStreak.count &&
                  stats.currentStreak.type === "win"
                    ? "h-8 w-8 text-profit"
                    : "h-8 w-8 text-faint"
                }
                aria-hidden="true"
              />
            }
          />
        </div>

        <div className="grid-dense grid-cols-2 lg:grid-cols-4">
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
            label="Max drawdown"
            value={formatCurrency(score.maxDrawdown)}
            icon={TrendingDown}
            tone={score.maxDrawdownPct > 10 ? "loss" : "neutral"}
            hint={`${score.maxDrawdownPct.toFixed(1)}% of starting balance`}
          />
        </div>

        {/*
          Curve and score stack in a narrow left rail against the calendar,
          which gets the width. The month grid is the densest thing on the
          page and the one a trader scans first for the shape of the month.
        */}
        <div className="grid-dense grid-cols-1 lg:grid-cols-3 lg:items-start">
          <div className="grid-dense grid-cols-1 lg:col-span-1">
            <div className="card">
              <div className="mb-4 flex items-baseline justify-between gap-2">
                <h2 className="font-display text-[13px] font-bold tracking-tight text-foreground">
                  Equity curve
                </h2>
                <span className="text-[11px] text-faint">
                  From {formatCurrency(settings.startingBalance)}
                </span>
              </div>
              <EquityCurveChart data={equityCurve} />
            </div>

            <ScoreRadar score={score} />
          </div>

          <div className="lg:col-span-2">
            <CalendarHeatmap dailyPnl={dailyPnl} initialMonth={latestMonth} />
          </div>
        </div>

        <div className="grid-dense grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DailyPnlChart data={dailyPnl} />
          </div>
          <WinRateDonut wins={wins} losses={losses} breakEven={breakEven} />
        </div>

        <div className="grid-dense grid-cols-1 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">
              Win rate by day
            </h2>
            <WinRateBarChart
              data={WEEKDAYS.map((d) => ({
                label: d.slice(0, 3),
                stat: groupWinRate(trades, "day", d),
              }))}
            />
          </div>
          <div className="card">
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">
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
          <div className="card">
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">Averages</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-profit" aria-hidden="true" />
                  Avg win
                </dt>
                <dd className="figure font-medium text-profit">
                  {formatCurrency(stats.avgWin)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-loss" aria-hidden="true" />
                  Avg loss
                </dt>
                <dd className="figure font-medium text-loss">
                  -{formatCurrency(stats.avgLoss)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">
              Best / worst day
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {stats.bestDay ? stats.bestDay.date : "—"}
                </dt>
                <dd className="figure font-medium text-profit">
                  {stats.bestDay ? formatCurrency(stats.bestDay.pnl) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {stats.worstDay ? stats.worstDay.date : "—"}
                </dt>
                <dd className="figure font-medium text-loss">
                  {stats.worstDay ? formatCurrency(stats.worstDay.pnl) : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[13px] font-bold tracking-tight text-foreground">Recent trades</h2>
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
