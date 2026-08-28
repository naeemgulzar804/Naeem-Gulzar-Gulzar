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

const HIGHLIGHT = "var(--chart-2)"; // amber — the reference's second chart colour

// Bar length already encodes the rate, so colouring every bar by performance
// adds noise and burns the green/red pair that should mean money. Instead the
// series stays violet and amber marks the top performer, which is the one
// value a comparison chart exists to surface.
function rateColor(rate: number | null, isBest = false) {
  if (rate === null) return NEUTRAL;
  return isBest ? HIGHLIGHT : ACCENT;
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
    <div className="card">
      <h2 className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground">Win rate</h2>
      <p className="sr-only">
        {wins} wins, {losses} losses, {breakEven} break even — a{" "}
        {rate.toFixed(1)}% win rate.
      </p>

      <div className="relative h-36" aria-hidden="true">
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
              "figure text-2xl font-bold",
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
            <p className={cn("figure text-lg font-bold", cls as string)}>
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
        className="w-12 shrink-0 text-right figure text-xs font-semibold"
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
/*
 * Recharts silently drops category ticks that would overlap, which at 375px
 * left one bar with no label at all. Rendering every tick and wrapping the
 * long ones onto a second line keeps all four labelled.
 */
function WrappedTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  const value = String(payload?.value ?? "");
  const lines =
    value.length <= 10
      ? [value]
      : (() => {
          const at = Math.max(value.lastIndexOf(" "), value.lastIndexOf("/"));
          if (at <= 0) return [value];
          const head = value.slice(0, value[at] === "/" ? at + 1 : at);
          return [head, value.slice(at + 1)];
        })();

  return (
    <text
      x={x}
      y={(y ?? 0) + 10}
      textAnchor="middle"
      fill="var(--color-muted-foreground)"
      fontSize={10}
    >
      {lines.map((line, i) => (
        <tspan key={line + i} x={x} dy={i === 0 ? 0 : 11}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function WinRateBarChart({
  data,
  height = 132,
}: {
  data: { label: string; stat: GroupWinRate | null }[];
  height?: number;
}) {
  const rows = data.map((d) => ({
    label: d.label,
    rate: d.stat?.rate ?? 0,
    count: d.stat?.count ?? 0,
  }));

  // Only worth highlighting a winner when something actually leads.
  const topRate = Math.max(...rows.map((r) => r.rate), 0);
  const hasClearBest =
    topRate > 0 && rows.filter((r) => r.rate === topRate).length === 1;

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
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 12, left: -18 }}>
            <XAxis
              dataKey="label"
              interval={0}
              tick={<WrappedTick />}
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
                <Cell
                  key={r.label}
                  fill={rateColor(r.rate, hasClearBest && r.rate === topRate)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
