import { PageHeader } from "@/components/page-header";
import { NewTradeForm } from "@/components/new-trade-form";
import { getPlaybooks } from "@/lib/data/playbooks";

export const metadata = { title: "New Trade — TradeLog" };

export default async function NewTradePage() {
  const playbooks = await getPlaybooks();

  return (
    <>
      <PageHeader title="New Trade" description="Log a trade to your journal." />
      <div className="flex-1 px-4 py-6 sm:px-8">
        <NewTradeForm playbooks={playbooks} />
      </div>
    </>
  );
}
