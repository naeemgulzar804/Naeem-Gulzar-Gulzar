import { Meh, PartyPopper, ShieldCheck, Frown } from "lucide-react";
import type { JournalEntry } from "@/lib/types";
import { Badge } from "@/components/badge";
import { formatDate } from "@/lib/utils";

const MOOD_META = {
  confident: { icon: PartyPopper, tone: "profit" as const, label: "Confident" },
  disciplined: { icon: ShieldCheck, tone: "accent" as const, label: "Disciplined" },
  neutral: { icon: Meh, tone: "neutral" as const, label: "Neutral" },
  frustrated: { icon: Frown, tone: "loss" as const, label: "Frustrated" },
};

export function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const meta = MOOD_META[entry.mood];
  const Icon = meta.icon;

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
    </article>
  );
}
