import { DollarSign, LineChart, Percent, Plus, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { TradeTable } from "@/components/trade-table";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";
import { getStats, getEquityCurve } from "@/lib/analytics";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const trades = await getTrades();

  if (trades.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Performance overview across all tracked trades."
        />
        <div className="flex-1 px-4 py-6 sm:px-8">
          <EmptyState
            icon={LineChart}
            title="No trades yet"
            description="Log your first trade to see your stats here, or load sample data to explore the app."
          >
            <a
              href="/trades/new"
              className="flex min-h-10 items-center gap-2 rounded-lg bg-profit px-4 text-sm font-semibold text-profit-foreground hover:bg-profit/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a trade
            </a>
            <SeedDemoButton />
          </EmptyState>
        </div>
      </>
    );
  }

  const stats = getStats(trades);
  const equityCurve = getEquityCurve(trades);
  const recentTrades = trades.slice(0, 8);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Performance overview across all tracked trades."
      />

      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Net P&L"
            value={formatCurrency(stats.netPnl)}
            icon={DollarSign}
            tone={stats.netPnl >= 0 ? "profit" : "loss"}
            hint={`${stats.totalTrades} trades logged`}
          />
          <StatCard
            label="Win rate"
            value={formatPercent(stats.winRate)}
            icon={Target}
            tone="neutral"
            hint={`${trades.filter((t) => t.pnl >= 0).length} wins / ${
              trades.filter((t) => t.pnl < 0).length
            } losses`}
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
            hint={`Current streak: ${stats.currentStreak.count} ${
              stats.currentStreak.type === "win"
                ? stats.currentStreak.count === 1
                  ? "win"
                  : "wins"
                : stats.currentStreak.count === 1
                  ? "loss"
                  : "losses"
            }`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Equity curve
              </h2>
              <span className="text-xs text-muted-foreground">
                Starting balance {formatCurrency(50000)}
              </span>
            </div>
            <EquityCurveChart data={equityCurve} />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Averages
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-profit" aria-hidden="true" />
                    Avg win
                  </dt>
                  <dd className="font-mono font-medium text-profit">
                    {formatCurrency(stats.avgWin)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-loss" aria-hidden="true" />
                    Avg loss
                  </dt>
                  <dd className="font-mono font-medium text-loss">
                    -{formatCurrency(stats.avgLoss)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Best / worst day
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {stats.bestDay ? stats.bestDay.date : "—"}
                  </dt>
                  <dd className="font-mono font-medium text-profit">
                    {stats.bestDay ? formatCurrency(stats.bestDay.pnl) : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {stats.worstDay ? stats.worstDay.date : "—"}
                  </dt>
                  <dd className="font-mono font-medium text-loss">
                    {stats.worstDay ? formatCurrency(stats.worstDay.pnl) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent trades
            </h2>
            <a
              href="/trades"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              View all
            </a>
          </div>
          <TradeTable trades={recentTrades} caption="Most recent 8 trades" />
        </div>
      </div>
    </>
  );
}
