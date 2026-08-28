"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Point {
  date: string;
  balance: number;
  pnl: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-primary px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{formatDate(point.date)}</p>
      <p className="mt-1 text-muted-foreground">
        Balance:{" "}
        <span className="figure text-foreground">
          {formatCurrency(point.balance)}
        </span>
      </p>
      <p
        className={point.pnl >= 0 ? "text-profit" : "text-loss"}
      >
        {point.pnl >= 0 ? "+" : ""}
        {formatCurrency(point.pnl)} that day
      </p>
    </div>
  );
}

export function EquityCurveChart({ data }: { data: Point[] }) {
  const start = data[0]?.balance ?? 0;
  const end = data[data.length - 1]?.balance ?? 0;
  const changePct = start ? ((end - start) / start) * 100 : 0;

  return (
    <div>
      <p className="sr-only">
        Equity curve from {formatCurrency(start)} to {formatCurrency(end)}, a{" "}
        {changePct >= 0 ? "gain" : "loss"} of {Math.abs(changePct).toFixed(1)}%
        over the period.
      </p>
      <div className="h-48 w-full sm:h-56" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatDate(d)}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              minTickGap={40}
            />
            <YAxis
              domain={["dataMin - 1000", "dataMax + 1000"]}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="url(#equityFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
