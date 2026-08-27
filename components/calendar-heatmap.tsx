"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyPnl } from "@/lib/types";
import { cn, formatCompactCurrency } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PROFIT_STEPS = ["bg-profit/10", "bg-profit/20", "bg-profit/35", "bg-profit/55"];
const LOSS_STEPS = ["bg-loss/10", "bg-loss/20", "bg-loss/35", "bg-loss/55"];

function intensityClass(pnl: number, maxAbs: number) {
  if (maxAbs === 0) return "";
  const ratio = Math.abs(pnl) / maxAbs;
  const step = ratio > 0.75 ? 3 : ratio > 0.5 ? 2 : ratio > 0.25 ? 1 : 0;
  return pnl >= 0 ? PROFIT_STEPS[step] : LOSS_STEPS[step];
}

export function CalendarHeatmap({
  dailyPnl,
  initialMonth,
}: {
  dailyPnl: DailyPnl[];
  initialMonth: string; // YYYY-MM
}) {
  const [monthKey, setMonthKey] = useState(initialMonth);

  const pnlByDate = useMemo(() => {
    const map = new Map<string, DailyPnl>();
    for (const d of dailyPnl) map.set(d.date, d);
    return map;
  }, [dailyPnl]);

  const [year, month] = monthKey.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();

  const monthDays = dailyPnl.filter((d) => d.date.startsWith(monthKey));
  const monthPnl = monthDays.reduce((s, d) => s + d.pnl, 0);
  const winDays = monthDays.filter((d) => d.pnl >= 0).length;
  const lossDays = monthDays.filter((d) => d.pnl < 0).length;
  const maxAbs = Math.max(1, ...monthDays.map((d) => Math.abs(d.pnl)));

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setMonthKey(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, day: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    cells.push({ date, day });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="w-44 text-center text-sm font-semibold text-foreground">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {winDays}W / {lossDays}L
          </span>
          <span
            className={cn(
              "tabular font-medium",
              monthPnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {monthPnl >= 0 ? "+" : ""}
            {formatCompactCurrency(monthPnl).replace("+", "")}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground sm:gap-2"
        role="grid"
        aria-label={`Daily P&L calendar for ${monthLabel}`}
      >
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="pb-1 font-medium" role="columnheader">
            {wd}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) {
            return <div key={`empty-${i}`} aria-hidden="true" />;
          }
          const entry = pnlByDate.get(cell.date);
          const hasTrades = Boolean(entry);
          return (
            <div
              key={cell.date}
              role="gridcell"
              aria-label={
                entry
                  ? `${cell.date}: ${entry.pnl >= 0 ? "profit" : "loss"} ${formatCompactCurrency(entry.pnl)}, ${entry.trades} trade${entry.trades === 1 ? "" : "s"}`
                  : `${cell.date}: no trades`
              }
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border text-[11px] sm:text-xs",
                hasTrades
                  ? cn("border-transparent font-medium", intensityClass(entry!.pnl, maxAbs), entry!.pnl >= 0 ? "text-profit" : "text-loss")
                  : "border-border/60 text-faint"
              )}
            >
              <span
                className={cn("text-[10px] sm:text-xs", hasTrades && "opacity-80")}
              >
                {cell.day}
              </span>
              {hasTrades ? (
                <span className="mt-0.5 tabular leading-none">
                  {formatCompactCurrency(entry!.pnl)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
