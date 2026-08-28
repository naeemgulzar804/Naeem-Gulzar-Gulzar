import Link from "next/link";
import { ListOrdered, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TradeLogClient } from "@/components/trade-log-client";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";

export const metadata = { title: "Trade Log — TradeLog" };

export default async function TradeLogPage() {
  const trades = await getTrades();
  const symbols = Array.from(new Set(trades.map((t) => t.symbol))).sort();

  return (
    <>
      <PageHeader
        title="Trade Log"
        description={
          trades.length
            ? `${trades.length} trades across ${symbols.join(", ")}.`
            : "Every trade you log will show up here."
        }
        actions={
          <Link
            href="/trades/new"
            className="flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New trade
          </Link>
        }
      />
      <div className="page">
        {trades.length === 0 ? (
          <EmptyState
            icon={ListOrdered}
            title="No trades logged"
            description="Add a trade manually, or load sample data to see how the trade log looks."
          >
            <SeedDemoButton />
          </EmptyState>
        ) : (
          <TradeLogClient trades={trades} />
        )}
      </div>
    </>
  );
}
