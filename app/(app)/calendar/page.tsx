import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";
import { getAccounts } from "@/lib/data/accounts";
import { ViewFilters } from "@/components/view-filters";
import { parseFilters, type SearchParams } from "@/lib/filters";
import { getDailyPnl } from "@/lib/analytics";

export const metadata = { title: "Calendar — TradeLog" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const accounts = await getAccounts();
  const trades = await getTrades(filters);
  const dailyPnl = getDailyPnl(trades);
  const latestMonth = dailyPnl.length
    ? dailyPnl[dailyPnl.length - 1].date.slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Daily P&L at a glance. Color and value both encode direction and size."
      actions={<ViewFilters accounts={accounts} />}
      />
      <div className="page">
        {trades.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No trades to show"
            description="Once you log trades, this calendar fills in with your daily P&L."
          >
            <SeedDemoButton />
          </EmptyState>
        ) : (
          <CalendarHeatmap dailyPnl={dailyPnl} initialMonth={latestMonth} />
        )}
      </div>
    </>
  );
}
