import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TradeForm } from "@/components/trade-form";
import { getPlaybooks } from "@/lib/data/playbooks";
import { getTrade } from "@/lib/data/trades";
import { getAccountSettings } from "@/lib/data/settings";

export const metadata = { title: "Edit Trade — TradeLog" };

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trade, playbooks, settings] = await Promise.all([
    getTrade(id),
    getPlaybooks(),
    getAccountSettings(),
  ]);

  if (!trade) notFound();

  return (
    <>
      <PageHeader
        title="Edit Trade"
        description={`${trade.symbol} · ${trade.date}`}
      />
      <div className="page">
        <TradeForm playbooks={playbooks} trade={trade} settings={settings} />
      </div>
    </>
  );
}
