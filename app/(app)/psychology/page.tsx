import { Brain } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { WinRateBar } from "@/components/analytics-charts";
import { getTrades } from "@/lib/data/trades";
import { groupWinRate } from "@/lib/analytics";
import { EMOTIONS } from "@/lib/types";
import type { Trade } from "@/lib/types";

export const metadata = { title: "Psychology — TradeLog" };

export default async function PsychologyPage() {
  const trades = await getTrades();
  const hasEmotions = trades.some(
    (t) => t.emotionBefore || t.emotionDuring || t.emotionAfter
  );

  if (trades.length === 0 || !hasEmotions) {
    return (
      <>
        <PageHeader
          title="Psychology"
          description="How emotions affect your trading."
        />
        <div className="flex-1 px-4 py-6 sm:px-8">
          <EmptyState
            icon={Brain}
            title="No psychology data yet"
            description="Record how you felt before, during, and after each trade to see which mental states actually produce your best results."
          >
            <SeedDemoButton />
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Psychology"
        description="How emotions affect your trading."
      />

      <div className="flex-1 space-y-4 px-4 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmotionPanel
            title="Emotion before trade"
            trades={trades}
            field="emotionBefore"
          />
          <EmotionPanel
            title="Emotion after trade"
            trades={trades}
            field="emotionAfter"
          />
        </div>

        <EmotionPanel
          title="Emotion during trade"
          trades={trades}
          field="emotionDuring"
        />

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Confidence level performance
          </h2>
          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
              <WinRateBar
                key={level}
                label={`Level ${level}`}
                stat={groupWinRate(trades, "confidence", level)}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function EmotionPanel({
  title,
  trades,
  field,
}: {
  title: string;
  trades: Trade[];
  field: "emotionBefore" | "emotionDuring" | "emotionAfter";
}) {
  const rows = EMOTIONS.map((emotion) => ({
    emotion,
    stat: groupWinRate(trades, field, emotion),
  })).filter((r) => r.stat);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No trades recorded with this emotion yet.
        </p>
      ) : (
        rows.map(({ emotion, stat }) => (
          <WinRateBar key={emotion} label={emotion} stat={stat} />
        ))
      )}
    </section>
  );
}
