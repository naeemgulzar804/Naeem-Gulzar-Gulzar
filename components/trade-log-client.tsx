"use client";

import { useMemo, useState } from "react";
import type { Trade } from "@/lib/types";
import { TradeTable } from "@/components/trade-table";
import { cn, formatCurrency } from "@/lib/utils";

const ALL = "all";

export function TradeLogClient({ trades }: { trades: Trade[] }) {
  const [symbol, setSymbol] = useState(ALL);
  const [grade, setGrade] = useState(ALL);
  const [side, setSide] = useState(ALL);

  const symbols = useMemo(
    () => Array.from(new Set(trades.map((t) => t.symbol))).sort(),
    [trades]
  );

  const filtered = useMemo(() => {
    return [...trades]
      .filter((t) => symbol === ALL || t.symbol === symbol)
      .filter((t) => grade === ALL || t.grade === grade)
      .filter((t) => side === ALL || t.side === side)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [trades, symbol, grade, side]);

  const netPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const winRate = filtered.length
    ? (filtered.filter((t) => t.pnl >= 0).length / filtered.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center gap-3"
        role="group"
        aria-label="Filter trades"
      >
        <Select label="Symbol" value={symbol} onChange={setSymbol}>
          <option value={ALL}>All symbols</option>
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select label="Grade" value={grade} onChange={setGrade}>
          <option value={ALL}>All grades</option>
          <option value="A+">A+</option>
          <option value="B">B</option>
        </Select>
        <Select label="Side" value={side} onChange={setSide}>
          <option value={ALL}>All sides</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </Select>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {filtered.length} trade{filtered.length === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">
            Win rate <span className="font-mono text-foreground">{winRate.toFixed(0)}%</span>
          </span>
          <span
            className={cn(
              "font-mono font-medium",
              netPnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {netPnl >= 0 ? "+" : ""}
            {formatCurrency(netPnl)}
          </span>
        </div>
      </div>

      {filtered.length ? (
        <TradeTable trades={filtered} caption="Filtered trade log" />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No trades match these filters.
        </p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-9 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </div>
  );
}
