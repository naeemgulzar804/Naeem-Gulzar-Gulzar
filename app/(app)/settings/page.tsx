import { PageHeader } from "@/components/page-header";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { ExportTrades } from "@/components/export-trades";
import { DeleteAllTrades } from "@/components/delete-all-trades";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";
import { getAccountSettings } from "@/lib/data/settings";

export const metadata = { title: "Settings — TradeLog" };

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="max-w-3xl">
      <h2
        id={id}
        className="mb-3 font-display text-[15px] font-bold tracking-tight text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [trades, settings] = await Promise.all([
    getTrades(),
    getAccountSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, your rules, and your data."
      />

      <div className="flex-1 space-y-8 px-4 py-6 sm:px-8">
        <Section id="account-heading" title="Account & risk limits">
          <AccountSettingsForm settings={settings} />
        </Section>

        <Section id="export-heading" title="Backup">
          <ExportTrades trades={trades} />
        </Section>

        <Section id="data-heading" title="Sample data">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              Loads a set of realistic demo trades so you can see how the
              dashboard, analytics, and pattern detection behave with a full
              history. Adds to what you already have rather than replacing it.
            </p>
            <div className="mt-4">
              <SeedDemoButton />
            </div>
          </div>
        </Section>

        <Section id="danger-heading" title="Danger zone">
          <DeleteAllTrades tradeCount={trades.length} />
        </Section>
      </div>
    </>
  );
}
