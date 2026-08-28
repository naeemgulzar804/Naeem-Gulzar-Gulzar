"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPnl } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

const TOOLTIP_STYLE = {
  background: "var(--color-secondary)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

/**
 * Net P&L per trading day. The equity curve shows where the account has got
 * to; this shows how it got there — whether the account is grinding up in
 * small steps or being carried by two outsized days, which the curve hides.
 */
export function DailyPnlChart({ data }: { data: DailyPnl[] }) {
  if (data.length === 0) return null;

  const rows = data.map((d) => ({
    date: d.date,
    pnl: Math.round(d.pnl * 100) / 100,
    trades: d.trades,
  }));

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-[13px] font-bold tracking-tight text-foreground">
          Net daily P&amp;L
        </h2>
        <span className="text-xs text-muted-foreground">
          {rows.length} trading {rows.length === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="sr-only">
        <table>
        <caption>Net profit and loss for each trading day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Net P&amp;L</th>
            <th scope="col">Trades</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date}>
              <td>{r.date}</td>
              <td>{formatCurrency(r.pnl)}</td>
              <td>{r.trades}</td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-40 sm:h-48" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              minTickGap={40}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              width={52}
            />
            {/* Zero has to be visible, or a red bar and a green bar of the
                same height look like the same result. */}
            <ReferenceLine y={0} stroke="var(--color-border-strong)" />
            <Tooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.35 }}
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(d) => String(d)}
              formatter={(value, _n, item) => [
                `${formatCurrency(Number(value))} · ${(item?.payload as { trades?: number })?.trades ?? 0} trades`,
                "Net P&L",
              ]}
            />
            <Bar dataKey="pnl" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {rows.map((r) => (
                <Cell
                  key={r.date}
                  fill={r.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
