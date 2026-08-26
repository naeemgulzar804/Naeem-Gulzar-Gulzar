import type { Trade } from "@/lib/types";
import { Badge } from "@/components/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function TradeTable({
  trades,
  caption,
}: {
  trades: Trade[];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">
              Date
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Symbol
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Side
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Playbook
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Grade
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              R
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              P&amp;L
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-border/60 last:border-0 hover:bg-secondary/40"
            >
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {formatDate(trade.date)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                {trade.symbol}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-medium",
                    trade.side === "long" ? "text-profit" : "text-loss"
                  )}
                >
                  {trade.side === "long" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {trade.side === "long" ? "Long" : "Short"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {trade.playbook}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Badge tone={trade.grade === "A+" ? "accent" : "neutral"}>
                  {trade.grade}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted-foreground">
                {trade.rMultiple >= 0 ? "+" : ""}
                {trade.rMultiple.toFixed(2)}R
              </td>
              <td
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-right font-mono font-medium",
                  trade.pnl >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {trade.pnl >= 0 ? "+" : ""}
                {formatCurrency(trade.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
