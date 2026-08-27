import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TradeForm } from "@/components/trade-form";
import { getPlaybooks } from "@/lib/data/playbooks";
import { getTrade } from "@/lib/data/trades";

export const metadata = { title: "Edit Trade — TradeLog" };

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trade, playbooks] = await Promise.all([getTrade(id), getPlaybooks()]);

  if (!trade) notFound();

  return (
    <>
      <PageHeader
        title="Edit Trade"
        description={`${trade.symbol} · ${trade.date}`}
      />
      <div className="flex-1 px-4 py-6 sm:px-8">
        <TradeForm playbooks={playbooks} trade={trade} />
      </div>
    </>
  );
}
