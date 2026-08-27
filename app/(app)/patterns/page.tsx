import { Radar } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { PatternTiers } from "@/components/pattern-tiers";
import { getTrades } from "@/lib/data/trades";
import { findPatterns } from "@/lib/patterns";

export const metadata = { title: "Patterns — TradeLog" };

export default async function PatternsPage() {
  const trades = await getTrades();
  const report = findPatterns(trades);

  return (
    <>
      <PageHeader
        title="Patterns"
        description="Edges and leaks found in your own trade history."
      />

      <div className="flex-1 space-y-8 px-4 py-6 sm:px-8">
        {report.insufficientData ? (
          <EmptyState
            icon={Radar}
            title="Not enough history yet"
            description={`Pattern detection needs at least 15 closed trades to separate signal from luck — you have ${report.closedCount}. Keep logging and this fills in.`}
          >
            {trades.length === 0 ? <SeedDemoButton /> : null}
          </EmptyState>
        ) : (
          <PatternTiers report={report} />
        )}
      </div>
    </>
  );
}
