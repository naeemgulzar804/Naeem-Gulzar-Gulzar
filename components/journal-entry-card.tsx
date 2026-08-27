import Link from "next/link";
import { Meh, PartyPopper, ShieldCheck, Frown } from "lucide-react";
import type { JournalEntry, Trade } from "@/lib/types";
import { Badge } from "@/components/badge";
import { formatDate } from "@/lib/utils";

const MOOD_META = {
  confident: { icon: PartyPopper, tone: "profit" as const, label: "Confident" },
  disciplined: { icon: ShieldCheck, tone: "accent" as const, label: "Disciplined" },
  neutral: { icon: Meh, tone: "neutral" as const, label: "Neutral" },
  frustrated: { icon: Frown, tone: "loss" as const, label: "Frustrated" },
};

export function JournalEntryCard({
  entry,
  trades,
}: {
  entry: JournalEntry;
  trades: Trade[];
}) {
  const meta = MOOD_META[entry.mood];
  const Icon = meta.icon;

  // A linked trade can have been deleted since; drop those rather than
  // rendering a link that 404s.
  const linked = entry.linkedTradeIds
    .map((id) => trades.find((t) => t.id === id))
    .filter((t): t is Trade => Boolean(t));

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">
            {entry.title}
          </h3>
        </div>
        <Badge tone={meta.tone} className="flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {meta.label}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {entry.content}
      </p>

      {linked.length ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {linked.length === 1 ? "Linked trade" : "Linked trades"}
          </p>
          <div className="flex flex-wrap gap-2">
            {linked.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t.symbol}
                <span className={t.result === "Win" ? "text-profit" : "text-loss"}>
                  {t.rMultiple >= 0 ? "+" : ""}
                  {t.rMultiple.toFixed(2)}R
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
