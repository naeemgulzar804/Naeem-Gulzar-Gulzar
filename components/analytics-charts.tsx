"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GroupWinRate } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROFIT = "var(--color-profit)";
const LOSS = "var(--color-loss)";
const NEUTRAL = "var(--color-faint)";
const ACCENT = "var(--color-accent)";

// Shared tooltip chrome so every chart reads as one system.
const TOOLTIP_STYLE = {
  background: "var(--color-secondary)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: 12,
  fontSize: 12,
} as const;

// Bar length already encodes the rate, so colouring each bar by performance
// adds noise without adding information — and it burns the green/red pair that
// should mean money. Comparison charts stay one accent colour.
function rateColor(rate: number | null) {
  return rate === null ? NEUTRAL : ACCENT;
}

/** Win / Loss / Break-even split with the win rate called out in the middle. */
export function WinRateDonut({
  wins,
  losses,
  breakEven,
}: {
  wins: number;
  losses: number;
  breakEven: number;
}) {
  const closed = wins + losses;
  const rate = closed ? (wins / closed) * 100 : 0;
  const data = [
    { name: "Win", value: wins, fill: PROFIT },
    { name: "Loss", value: losses, fill: LOSS },
    { name: "Break Even", value: breakEven, fill: NEUTRAL },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Win rate</h2>
      <p className="sr-only">
        {wins} wins, {losses} losses, {breakEven} break even — a{" "}
        {rate.toFixed(1)}% win rate.
      </p>

      <div className="relative h-40" aria-hidden="true">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="72%"
                outerRadius="100%"
                strokeWidth={0}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "tabular text-2xl font-bold",
              rate >= 50 ? "text-profit" : "text-loss"
            )}
          >
            {rate.toFixed(1)}%
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Win rate
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-around border-t border-border pt-4">
        {[
          ["Win", wins, "text-profit"],
          ["Loss", losses, "text-loss"],
          ["B/E", breakEven, "text-muted-foreground"],
        ].map(([label, value, cls]) => (
          <div key={String(label)} className="text-center">
            <p className={cn("tabular text-lg font-bold", cls as string)}>
              {value as number}
            </p>
            <p className="text-xs text-muted-foreground">{label as string}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal win-rate bar with the underlying trade count kept visible. */
export function WinRateBar({
  label,
  stat,
}: {
  label: string;
  stat: GroupWinRate | null;
}) {
  const rate = stat?.rate ?? null;
  const color = rateColor(rate);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate ?? 0}%`, background: color }}
        />
      </div>
      <span
        className="w-12 shrink-0 text-right tabular text-xs font-semibold"
        style={{ color }}
      >
        {rate !== null ? `${rate}%` : "—"}
      </span>
      <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">
        {stat?.count ?? 0}T
      </span>
    </div>
  );
}

/** Vertical bars comparing win rate across a category (day, session, …). */
export function WinRateBarChart({
  data,
  height = 160,
}: {
  data: { label: string; stat: GroupWinRate | null }[];
  height?: number;
}) {
  const rows = data.map((d) => ({
    label: d.label,
    rate: d.stat?.rate ?? 0,
    count: d.stat?.count ?? 0,
  }));

  return (
    <>
      <table className="sr-only">
        <caption>Win rate by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Win rate</th>
            <th scope="col">Trades</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{r.rate}%</td>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, _name, item) => [
                `${value}% (${(item?.payload as { count?: number })?.count ?? 0} trades)`,
                "Win rate",
              ]}
            />
            <Bar dataKey="rate" radius={[5, 5, 0, 0]} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.label} fill={rateColor(r.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
