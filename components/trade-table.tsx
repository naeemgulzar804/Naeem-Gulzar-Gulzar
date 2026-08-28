"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Images, Trash2 } from "lucide-react";
import type { Trade } from "@/lib/types";
import { Badge } from "@/components/badge";
import { chartCount } from "@/components/chart-review-panel";
import { deleteTradeAction } from "@/lib/actions/trades";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function TradeTable({
  trades,
  caption,
  detailed = false,
  onOpenCharts,
}: {
  trades: Trade[];
  caption?: string;
  detailed?: boolean;
  onOpenCharts?: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-card">
      <table className="w-full min-w-[860px] border-collapse text-[13px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="sticky top-0 z-10 border-b border-border bg-card text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="h-8 px-3 font-medium">Pair</th>
            <th scope="col" className="h-8 px-3 font-medium">Date</th>
            {detailed ? (
              <>
                <th scope="col" className="h-8 px-3 font-medium">Session</th>
                <th scope="col" className="h-8 px-3 font-medium">Bias</th>
                <th scope="col" className="h-8 px-3 font-medium">H4</th>
              </>
            ) : null}
            <th scope="col" className="h-8 px-3 font-medium">Side</th>
            <th scope="col" className="h-8 px-3 font-medium">Setup</th>
            <th scope="col" className="h-8 px-3 font-medium">Entry</th>
            <th scope="col" className="h-8 px-3 text-right font-medium">R</th>
            <th scope="col" className="h-8 px-3 text-right font-medium">P&amp;L</th>
            <th scope="col" className="h-8 px-3 font-medium">Result</th>
            <th scope="col" className="h-8 px-3 font-medium">Charts</th>
            {detailed ? (
              <th scope="col" className="h-8 px-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => (
            <tr
              key={trade.id}
              className="h-[var(--row-h)] border-b border-border/60 last:border-0 hover:bg-secondary/40"
            >
              <td className="whitespace-nowrap px-3">
                <Link
                  href={`/trades/${trade.id}`}
                  className="flex h-[var(--row-h)] items-center font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {trade.symbol}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 text-muted-foreground">
                {formatDate(trade.date)}
                {trade.day ? (
                  <span className="ml-1 text-xs text-muted-foreground/70">
                    {trade.day.slice(0, 3)}
                  </span>
                ) : null}
              </td>
              {detailed ? (
                <>
                  <td className="whitespace-nowrap px-3">
                    {trade.session ? (
                      <Badge tone="neutral">{trade.session.split("/")[0]}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3">
                    {trade.dailyBias ? (
                      <Badge tone={trade.dailyBias === "Bullish" ? "profit" : "loss"}>
                        {trade.dailyBias}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 text-muted-foreground">
                    {trade.h4Candle || "—"}
                  </td>
                </>
              ) : null}
              <td className="whitespace-nowrap px-3">
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
              <td className="whitespace-nowrap px-3">
                <Badge tone={trade.grade === "A+" ? "accent" : "neutral"}>
                  {trade.grade}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 figure text-[11px] text-muted-foreground">
                {trade.entryTime || (trade.entryPrice ? trade.entryPrice : "—")}
              </td>
              <td className="whitespace-nowrap px-3 text-right figure text-muted-foreground">
                {trade.rMultiple >= 0 ? "+" : ""}
                {trade.rMultiple.toFixed(2)}R
              </td>
              <td
                className={cn(
                  "whitespace-nowrap px-3 text-right figure font-medium",
                  trade.pnl >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {trade.pnl >= 0 ? "+" : ""}
                {formatCurrency(trade.pnl)}
              </td>
              <td className="whitespace-nowrap px-3">
                <Badge
                  tone={
                    trade.result === "Win"
                      ? "profit"
                      : trade.result === "Loss"
                        ? "loss"
                        : "neutral"
                  }
                >
                  {trade.result}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3">
                {chartCount(trade) > 0 && onOpenCharts ? (
                  <button
                    type="button"
                    onClick={() => onOpenCharts(i)}
                    className="inline-flex items-center gap-1 rounded-md border border-accent-border/30 bg-accent-soft px-2 py-1 text-xs font-medium text-accent hover:bg-ring/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Images className="h-3.5 w-3.5" aria-hidden="true" />
                    {chartCount(trade)}
                  </button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              {detailed ? (
                <td className="whitespace-nowrap px-3 text-right">
                  <form action={deleteTradeAction} className="inline">
                    <input type="hidden" name="id" value={trade.id} />
                    <button
                      type="submit"
                      aria-label={`Delete ${trade.symbol} trade from ${formatDate(trade.date)}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-loss/10 hover:text-loss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
