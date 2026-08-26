import { PageHeader } from "@/components/page-header";
import { TradeLogClient } from "@/components/trade-log-client";
import { TRADES } from "@/lib/mock-data";

export const metadata = { title: "Trade Log — TradeLog" };

export default function TradeLogPage() {
  return (
    <>
      <PageHeader
        title="Trade Log"
        description={`${TRADES.length} trades across EURUSD, GBPUSD, XAUUSD, and USDJPY.`}
      />
      <div className="flex-1 px-4 py-6 sm:px-8">
        <TradeLogClient trades={TRADES} />
      </div>
    </>
  );
}
