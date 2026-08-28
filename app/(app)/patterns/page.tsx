import { Radar } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { PatternTiers } from "@/components/pattern-tiers";
import { getTrades } from "@/lib/data/trades";
import { getAccounts } from "@/lib/data/accounts";
import { ViewFilters } from "@/components/view-filters";
import { parseFilters, type SearchParams } from "@/lib/filters";
import { getAccountSettings } from "@/lib/data/accounts";
import { findPatterns } from "@/lib/patterns";

export const metadata = { title: "Patterns — TradeLog" };

export default async function PatternsPage({
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
  const report = findPatterns(trades, settings);

  return (
    <>
      <PageHeader
        title="Patterns"
        description="Edges and leaks found in your own trade history."
      actions={<ViewFilters accounts={accounts} />}
      />

      <div className="page">
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
