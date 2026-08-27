import { PageHeader } from "@/components/page-header";
import { DeleteAllTrades } from "@/components/delete-all-trades";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";

export const metadata = { title: "Settings — TradeLog" };

export default async function SettingsPage() {
  const trades = await getTrades();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage the data in your journal."
      />

      <div className="flex-1 space-y-8 px-4 py-6 sm:px-8">
        <section aria-labelledby="data-heading" className="max-w-3xl">
          <h2
            id="data-heading"
            className="mb-3 font-display text-[15px] font-bold tracking-tight text-foreground"
          >
            Sample data
          </h2>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Loads a set of realistic demo trades so you can see how the
              dashboard, analytics, and pattern detection behave with a full
              history. Adds to what you already have rather than replacing it.
            </p>
            <div className="mt-4">
              <SeedDemoButton />
            </div>
          </div>
        </section>

        <section aria-labelledby="danger-heading" className="max-w-3xl">
          <h2
            id="danger-heading"
            className="mb-3 font-display text-[15px] font-bold tracking-tight text-foreground"
          >
            Danger zone
          </h2>
          <DeleteAllTrades tradeCount={trades.length} />
        </section>
      </div>
    </>
  );
}
