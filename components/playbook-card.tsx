import { ListChecks } from "lucide-react";
import type { Playbook, Trade } from "@/lib/types";
import { Badge } from "@/components/badge";
import { cn, formatCurrency } from "@/lib/utils";

export function PlaybookCard({
  playbook,
  trades,
}: {
  playbook: Playbook;
  trades: Trade[];
}) {
  const wins = trades.filter((t) => t.pnl >= 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
            {playbook.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {playbook.summary}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {playbook.rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
            {rule}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {playbook.tags.map((tag) => (
          <Badge key={tag} tone="neutral">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">
          {trades.length} trade{trades.length === 1 ? "" : "s"} · {winRate.toFixed(0)}% win rate
        </span>
        <span className={cn("tabular font-medium", netPnl >= 0 ? "text-profit" : "text-loss")}>
          {netPnl >= 0 ? "+" : ""}
          {formatCurrency(netPnl)}
        </span>
      </div>
    </div>
  );
}
