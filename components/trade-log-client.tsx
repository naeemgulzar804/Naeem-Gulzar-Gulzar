"use client";

import { useMemo, useState } from "react";
import type { Trade } from "@/lib/types";
import { SETUP_GRADES } from "@/lib/types";
import { TradeTable } from "@/components/trade-table";
import { ChartReviewPanel } from "@/components/chart-review-panel";
import { cn, formatCurrency } from "@/lib/utils";

const ALL = "all";

export function TradeLogClient({ trades }: { trades: Trade[] }) {
  const [symbol, setSymbol] = useState(ALL);
  const [grade, setGrade] = useState(ALL);
  const [side, setSide] = useState(ALL);
  const [bias, setBias] = useState(ALL);
  const [result, setResult] = useState(ALL);
  const [chartIndex, setChartIndex] = useState<number | null>(null);

  const symbols = useMemo(
    () => Array.from(new Set(trades.map((t) => t.symbol))).sort(),
    [trades]
  );

  const filtered = useMemo(
    () =>
      trades
        .filter((t) => symbol === ALL || t.symbol === symbol)
        .filter((t) => grade === ALL || t.grade === grade)
        .filter((t) => side === ALL || t.side === side)
        .filter((t) => bias === ALL || t.dailyBias === bias)
        .filter((t) => result === ALL || t.result === result),
    [trades, symbol, grade, side, bias, result]
  );

  const netPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const closed = filtered.filter(
    (t) => t.result === "Win" || t.result === "Loss"
  );
  const winRate = closed.length
    ? (closed.filter((t) => t.result === "Win").length / closed.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filter trades">
        <Select label="Symbol" value={symbol} onChange={setSymbol}>
          <option value={ALL}>All symbols</option>
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select label="Setup" value={grade} onChange={setGrade}>
          <option value={ALL}>All setups</option>
          {SETUP_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Select label="Bias" value={bias} onChange={setBias}>
          <option value={ALL}>All biases</option>
          <option value="Bullish">Bullish</option>
          <option value="Bearish">Bearish</option>
        </Select>
        <Select label="Side" value={side} onChange={setSide}>
          <option value={ALL}>All sides</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </Select>
        <Select label="Result" value={result} onChange={setResult}>
          <option value={ALL}>All results</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="Break Even">Break Even</option>
        </Select>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {filtered.length} trade{filtered.length === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">
            Win rate{" "}
            <span className="font-mono text-foreground">{winRate.toFixed(0)}%</span>
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
        <TradeTable
          trades={filtered}
          caption="Filtered trade log"
          detailed
          onOpenCharts={setChartIndex}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No trades match these filters.
        </p>
      )}

      {chartIndex !== null ? (
        <ChartReviewPanel
          trades={filtered}
          index={chartIndex}
          onClose={() => setChartIndex(null)}
          onNavigate={(d) =>
            setChartIndex((i) => {
              if (i === null) return i;
              const next = i + d;
              return next >= 0 && next < filtered.length ? next : i;
            })
          }
        />
      ) : null}
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
