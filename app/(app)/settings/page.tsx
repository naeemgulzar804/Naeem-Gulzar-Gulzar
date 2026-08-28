import { PageHeader } from "@/components/page-header";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { ExportTrades } from "@/components/export-trades";
import { DeleteAllTrades } from "@/components/delete-all-trades";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { getTrades } from "@/lib/data/trades";
import { getAccounts } from "@/lib/data/accounts";
import { DEFAULT_ACCOUNT_SETTINGS } from "@/lib/types";
import type { Account } from "@/lib/types";

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
        className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [trades, accounts] = await Promise.all([getTrades(), getAccounts()]);

  // A blank account for the "add another" form at the bottom of the list.
  const blank: Account = {
    ...DEFAULT_ACCOUNT_SETTINGS,
    id: "new",
    name: "",
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, your rules, and your data."
      />

      <div className="page">
        <Section id="account-heading" title="Accounts & risk limits">
          <div className="flex flex-col gap-3">
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accounts yet — add your first below.
              </p>
            ) : (
              accounts.map((account) => (
                <AccountSettingsForm key={account.id} account={account} />
              ))
            )}
            <AccountSettingsForm account={blank} isNew />
          </div>
        </Section>

        <Section id="export-heading" title="Backup">
          <ExportTrades trades={trades} />
        </Section>

        <Section id="data-heading" title="Sample data">
          <div className="card">
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
