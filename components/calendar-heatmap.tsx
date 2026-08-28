"use client";

import { Fragment, useMemo, useState } from "react";
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
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });

  /*
   * A week summary beside each row. Weeks are the unit a funded account is
   * actually managed in — a bad Tuesday matters less than a bad week — and
   * the number is hard to get from seven separate cells by eye.
   */
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => {
    const days = cells
      .slice(w * 7, w * 7 + 7)
      .map((c) => (c.date ? pnlByDate.get(c.date) : undefined))
      .filter((d): d is DailyPnl => Boolean(d));
    return {
      pnl: days.reduce((sum, d) => sum + d.pnl, 0),
      days: days.length,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-9 lg:w-9"
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
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-9 lg:w-9"
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
              "figure font-medium",
              monthPnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {monthPnl >= 0 ? "+" : ""}
            {formatCompactCurrency(monthPnl).replace("+", "")}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground sm:grid-cols-[repeat(7,minmax(0,1fr))_auto] sm:gap-2"
        role="grid"
        aria-label={`Daily P&L calendar for ${monthLabel}`}
      >
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="pb-1 font-medium" role="columnheader">
            {wd}
          </div>
        ))}
        <div
          className="hidden pb-1 pl-1 text-right font-medium sm:block"
          role="columnheader"
        >
          Week
        </div>
        {cells.map((cell, i) => {
          const weekCell =
            i % 7 === 6 ? (
              <WeekSummary key={`week-${i}`} week={weeks[(i - 6) / 7]} />
            ) : null;

          if (!cell.date) {
            return (
              <Fragment key={`empty-${i}`}>
                <div aria-hidden="true" />
                {weekCell}
              </Fragment>
            );
          }
          const entry = pnlByDate.get(cell.date);
          const hasTrades = Boolean(entry);
          return (
            <Fragment key={cell.date}>
            <div
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
                <span className="mt-0.5 figure leading-none">
                  {formatCompactCurrency(entry!.pnl)}
                </span>
              ) : null}
            </div>
            {weekCell}
            </Fragment>
          );
        })}
      </div>

      <ul className="flex flex-col gap-1 sm:hidden" aria-label="Weekly totals">
        {weeks.map((week, i) =>
          week.days ? (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs"
            >
              <span className="text-muted-foreground">
                Week {i + 1} · {week.days} {week.days === 1 ? "day" : "days"}
              </span>
              <span
                className={cn(
                  "figure font-semibold",
                  week.pnl >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {formatCompactCurrency(week.pnl)}
              </span>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}

/** One week's net P&L and how many days of it were traded. */
function WeekSummary({ week }: { week: { pnl: number; days: number } }) {
  const traded = week.days > 0;
  return (
    <div
      role="gridcell"
      className={cn(
        "hidden min-w-16 flex-col items-end justify-center rounded-lg border px-2 text-[11px] sm:flex",
        traded ? "border-border bg-secondary/40" : "border-border/40"
      )}
    >
      {traded ? (
        <>
          <span
            className={cn(
              "figure font-semibold leading-none",
              week.pnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {formatCompactCurrency(week.pnl)}
          </span>
          <span className="mt-0.5 text-[10px] text-faint">
            {week.days} {week.days === 1 ? "day" : "days"}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-faint">—</span>
      )}
    </div>
  );
}
