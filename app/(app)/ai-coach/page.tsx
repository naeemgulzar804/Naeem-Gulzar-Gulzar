import { PageHeader } from "@/components/page-header";
import { AICoach } from "@/components/ai-coach";
import { getTrades } from "@/lib/data/trades";
import { getAccounts } from "@/lib/data/accounts";
import { ViewFilters } from "@/components/view-filters";
import { parseFilters, type SearchParams } from "@/lib/filters";

export const metadata = { title: "AI Coach — TradeLog" };

export default async function AICoachPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const accounts = await getAccounts();
  const trades = await getTrades(filters);

  return (
    <>
      <PageHeader
        title="AI Coach"
        description="Personalized ICT/SMC analysis of your journal, powered by Claude."
      actions={<ViewFilters accounts={accounts} />}
      />
      <div className="page">
        <AICoach trades={trades} />
      </div>
    </>
  );
}
