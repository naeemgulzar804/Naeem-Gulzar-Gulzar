import { PageHeader } from "@/components/page-header";
import { TradeForm } from "@/components/trade-form";
import { getPlaybooks } from "@/lib/data/playbooks";
import { getAccountSettings } from "@/lib/data/settings";

export const metadata = { title: "New Trade — TradeLog" };

export default async function NewTradePage() {
  const [playbooks, settings] = await Promise.all([
    getPlaybooks(),
    getAccountSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Log New Trade"
        description="Document your setup and execution."
      />
      <div className="page">
        <TradeForm playbooks={playbooks} settings={settings} />
      </div>
    </>
  );
}
