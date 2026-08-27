import { PageHeader } from "@/components/page-header";
import { AICoach } from "@/components/ai-coach";
import { getTrades } from "@/lib/data/trades";

export const metadata = { title: "AI Coach — TradeLog" };

export default async function AICoachPage() {
  const trades = await getTrades();

  return (
    <>
      <PageHeader
        title="AI Coach"
        description="Personalized ICT/SMC analysis of your journal, powered by Claude."
      />
      <div className="flex-1 px-4 py-6 sm:px-8">
        <AICoach trades={trades} />
      </div>
    </>
  );
}
