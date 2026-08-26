import { PageHeader } from "@/components/page-header";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { getDailyPnl } from "@/lib/mock-data";

export const metadata = { title: "Calendar — TradeLog" };

export default function CalendarPage() {
  const dailyPnl = getDailyPnl();
  const latestMonth = dailyPnl.length
    ? dailyPnl[dailyPnl.length - 1].date.slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Daily P&L at a glance. Color and value both encode direction and size."
      />
      <div className="flex-1 px-4 py-6 sm:px-8">
        <CalendarHeatmap dailyPnl={dailyPnl} initialMonth={latestMonth} />
      </div>
    </>
  );
}
