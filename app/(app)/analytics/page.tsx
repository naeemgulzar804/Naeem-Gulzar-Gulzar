import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import {
  WinRateBar,
  WinRateBarChart,
  WinRateDonut,
} from "@/components/analytics-charts";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { ExpectancyPanel, RDistribution } from "@/components/expectancy-panel";
import { DisciplinePanel } from "@/components/discipline-panel";
import { ExcursionPanel } from "@/components/excursion-panel";
import { getTrades } from "@/lib/data/trades";
import { getAccounts } from "@/lib/data/accounts";
import { ViewFilters } from "@/components/view-filters";
import { parseFilters, type SearchParams } from "@/lib/filters";
import { getAccountSettings } from "@/lib/data/accounts";
import {
  confluenceWinRate,
  getEquityCurve,
  getExcursionReport,
  getExpectancy,
  getRDistribution,
  groupWinRate,
} from "@/lib/analytics";
import { getDisciplineRates } from "@/lib/risk";
import {
  CONFLUENCES,
  ENTRY_MODELS,
  ENTRY_TIMES,
  H4_CANDLES,
  SESSIONS,
  SETUP_GRADES,
  WEEKDAYS,
} from "@/lib/types";

export const metadata = { title: "Analytics — TradeLog" };

export default async function AnalyticsPage({
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
          title="Analytics"
          description="Discover patterns in your performance."
        actions={<ViewFilters accounts={accounts} />}
      />
        <div className="page">
          <EmptyState
            icon={BarChart3}
            title="Nothing to analyze yet"
            description="Log trades and this page breaks down what's actually working."
          >
            <SeedDemoButton />
          </EmptyState>
        </div>
      </>
    );
  }

  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const breakEven = trades.filter((t) => t.result === "Break Even").length;
  const symbols = Array.from(new Set(trades.map((t) => t.symbol))).sort();
  const expectancy = getExpectancy(trades);
  const rBuckets = getRDistribution(trades);
  const discipline = getDisciplineRates(trades, settings);
  const excursions = getExcursionReport(trades);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Discover patterns in your performance."
      actions={<ViewFilters accounts={accounts} />}
      />

      <div className="page">
        <div className="grid-dense grid-cols-1 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">
              Equity curve
            </h2>
            <EquityCurveChart
              data={getEquityCurve(trades, settings.startingBalance)}
            />
          </div>
          <WinRateDonut wins={wins} losses={losses} breakEven={breakEven} />
        </div>

        <div className="grid-dense grid-cols-1 lg:grid-cols-3">
          {expectancy ? <ExpectancyPanel expectancy={expectancy} /> : null}
          <RDistribution buckets={rBuckets} />
          <DisciplinePanel rates={discipline} />
          <ExcursionPanel report={excursions} />
        </div>

        <div className="grid-dense grid-cols-1 lg:grid-cols-2">
          <Panel title="Win rate by day">
            <WinRateBarChart
              data={WEEKDAYS.map((d) => ({
                label: d.slice(0, 3),
                stat: groupWinRate(trades, "day", d),
              }))}
            />
          </Panel>
          <Panel title="Session performance">
            <WinRateBarChart
              data={SESSIONS.map((s) => ({
                label: s === "London/NY Overlap" ? "Overlap" : s,
                stat: groupWinRate(trades, "session", s),
              }))}
            />
          </Panel>
        </div>

        <div className="grid-dense grid-cols-1 lg:grid-cols-2">
          <Panel title="Setup quality">
            {SETUP_GRADES.map((g) => (
              <WinRateBar
                key={g}
                label={`Setup ${g}`}
                stat={groupWinRate(trades, "grade", g)}
              />
            ))}

            <Divider />
            <SubHeading>Daily bias</SubHeading>
            {["Bullish", "Bearish"].map((b) => (
              <WinRateBar
                key={b}
                label={b}
                stat={groupWinRate(trades, "dailyBias", b)}
              />
            ))}

            <Divider />
            <SubHeading>Entry time</SubHeading>
            {ENTRY_TIMES.map((t) => (
              <WinRateBar
                key={t}
                label={t}
                stat={groupWinRate(trades, "entryTime", t)}
              />
            ))}

            <Divider />
            <SubHeading>H4 candle</SubHeading>
            {H4_CANDLES.map((c) => (
              <WinRateBar
                key={c}
                label={c}
                stat={groupWinRate(trades, "h4Candle", c)}
              />
            ))}
          </Panel>

          <Panel title="Confluence win rates">
            {CONFLUENCES.map((c) => (
              <WinRateBar key={c} label={c} stat={confluenceWinRate(trades, c)} />
            ))}

            <Divider />
            <SubHeading>Entry model</SubHeading>
            {ENTRY_MODELS.map((m) => (
              <WinRateBar
                key={m}
                label={m}
                stat={groupWinRate(trades, "entryModel", m)}
              />
            ))}

            <Divider />
            <SubHeading>Liquidity purge</SubHeading>
            <WinRateBar
              label="Purge present"
              stat={groupWinRate(trades, "liquidityPurge", true)}
            />
            <WinRateBar
              label="No purge"
              stat={groupWinRate(trades, "liquidityPurge", false)}
            />
          </Panel>
        </div>

        <Panel title="Pair performance">
          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {symbols.map((s) => (
              <WinRateBar key={s} label={s} stat={groupWinRate(trades, "symbol", s)} />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function Divider() {
  return <hr className="my-4 border-border" />;
}
