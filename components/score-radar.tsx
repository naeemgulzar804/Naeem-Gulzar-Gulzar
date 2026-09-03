"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TradingScore } from "@/lib/score";
import { ScoreMeter } from "@/components/metric-visuals";

const ACCENT = "var(--color-accent)";

const TOOLTIP_STYLE = {
  background: "var(--color-secondary)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: 12,
  fontSize: 12,
} as const;

/**
 * The account's six health axes as a single shape.
 *
 * The composite number is the headline, but the polygon is the actual value
 * here: a balanced hexagon and a spike with three collapsed axes can share a
 * score, and only one of them is a durable account. Every vertex therefore
 * shows its raw figure in the tooltip, so the normalised 0-100 axis never has
 * to be taken on trust.
 */
export function ScoreRadar({ score }: { score: TradingScore }) {
  const data = score.axes.map((axis) => ({
    axis: axis.label,
    value: Math.round(axis.value),
    raw: axis.raw,
  }));

  return (
    <div className="card flex flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[13px] font-bold tracking-tight text-foreground">
          Account score
        </h2>
        <span className="text-[11px] text-faint">Weighted, 0&ndash;100</span>
      </div>

      <div className="mt-3 h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--color-foreground)" }}
              formatter={(value, _name, item) => {
                const raw = (item?.payload as { raw?: string } | undefined)?.raw;
                return [`${value}/100${raw ? ` · ${raw}` : ""}`, "Score"];
              }}
            />
            <Radar
              dataKey="value"
              stroke={ACCENT}
              fill={ACCENT}
              fillOpacity={0.28}
              /* The shape is read at a glance; animating it on every filter
                 change makes the dashboard feel unsettled rather than alive. */
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex items-end justify-between gap-4">
        <div>
          <p className="figure text-[26px] font-bold leading-none text-foreground">
            {score.score.toFixed(1)}
          </p>
          <p className="mt-1 text-[11px] text-faint">Composite</p>
        </div>
        <div className="w-1/2 max-w-[180px]">
          <ScoreMeter value={score.score} />
        </div>
      </div>
    </div>
  );
}
