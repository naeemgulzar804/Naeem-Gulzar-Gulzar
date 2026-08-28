import { PageHeader } from "@/components/page-header";
import { TradeForm } from "@/components/trade-form";
import { getPlaybooks } from "@/lib/data/playbooks";
import { getAccountSettings, getAccounts } from "@/lib/data/accounts";

export const metadata = { title: "New Trade — TradeLog" };

export default async function NewTradePage() {
  const [playbooks, settings, accounts] = await Promise.all([
    getPlaybooks(),
    getAccountSettings(),
    getAccounts(),
  ]);

  return (
    <>
      <PageHeader
        title="Log New Trade"
        description="Document your setup and execution."
      />
      <div className="page">
        <TradeForm playbooks={playbooks} settings={settings} accounts={accounts} />
      </div>
    </>
  );
}
