import { cn } from "@/lib/utils";

/*
 * Small SVG meters for the dashboard stat row.
 *
 * All of them are plain SVG rather than a chart library: at this size a
 * Recharts instance costs a client bundle and a hydration pass to draw four
 * arcs, and these never need tooltips or a responsive container.
 *
 * Two rules hold throughout. Colour never carries meaning on its own — every
 * meter sits beside the figure it encodes, so it reads without colour vision.
 * And violet stays the interface accent while green/red stay reserved for
 * money, matching the discipline set in globals.css.
 */

const TAU = Math.PI / 180;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  return {
    x: cx + r * Math.cos(angleDeg * TAU),
    y: cy - r * Math.sin(angleDeg * TAU),
  };
}

/** Arc path swept clockwise from `start` down to `end` (180° = left, 0° = right). */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
) {
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const largeArc = Math.abs(start - end) > 180 ? 1 : 0;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

export interface GaugeSegment {
  value: number;
  /** Stroke colour class, e.g. "stroke-profit". */
  className: string;
  label: string;
}

/**
 * Segmented half-circle gauge. Used for the win/break-even/loss split, where
 * the proportions matter as much as the headline percentage.
 */
export function GaugeArc({
  segments,
  className,
}: {
  segments: GaugeSegment[];
  className?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = 40;
  const cy = 34;
  const r = 28;
  const gap = total > 0 ? 3 : 0; // degrees of breathing room between segments

  /* Prefix sums rather than a running cursor: the map stays pure, which the
     React Compiler requires and which makes each arc independently derivable. */
  const offsets = segments.reduce<number[]>(
    (acc, seg) => [...acc, acc[acc.length - 1] + seg.value],
    [0]
  );

  const arcs = segments.map((seg, i) => {
    if (total === 0 || seg.value === 0) return null;
    const start = 180 - (offsets[i] / total) * 180;
    const end = 180 - (offsets[i + 1] / total) * 180;
    // Inset every segment except at the two outer ends of the sweep.
    const a = i === 0 ? start : start - gap / 2;
    const b = i === segments.length - 1 ? end : end + gap / 2;
    if (a <= b) return null;
    return (
      <path
        key={seg.label}
        d={arcPath(cx, cy, r, a, b)}
        className={seg.className}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
    );
  });

  return (
    <svg
      viewBox="0 0 80 40"
      className={cn("h-10 w-20 shrink-0", className)}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
    >
      <path
        d={arcPath(cx, cy, r, 180, 0)}
        className="stroke-border-strong"
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      {arcs}
    </svg>
  );
}

/**
 * Closed ring showing progress toward a target. Profit factor uses it with a
 * target of 2.0 — the level at which the account has real margin for error.
 */
export function RingMeter({
  value,
  target,
  tone = "accent",
  className,
}: {
  value: number;
  target: number;
  tone?: "accent" | "profit" | "loss";
  className?: string;
}) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const ratio = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  const strokeClass =
    tone === "profit"
      ? "stroke-profit"
      : tone === "loss"
        ? "stroke-loss"
        : "stroke-accent";

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-11 w-11 shrink-0", className)}
      role="img"
      aria-label={`${value.toFixed(2)} against a target of ${target.toFixed(2)}`}
    >
      <circle
        cx={32}
        cy={32}
        r={r}
        className="stroke-border-strong"
        strokeWidth={7}
        fill="none"
      />
      <circle
        cx={32}
        cy={32}
        r={r}
        className={strokeClass}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        /* Start the sweep at 12 o'clock instead of 3. */
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

/**
 * Two-sided bar comparing average win against average loss. The split point
 * moves, so an account whose losses outrun its wins is visible instantly.
 */
export function DivergingBar({
  win,
  loss,
  className,
}: {
  win: number;
  loss: number;
  className?: string;
}) {
  const total = win + loss;
  const winPct = total > 0 ? (win / total) * 100 : 50;

  return (
    <div
      className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="img"
      aria-label={`Average win ${win.toFixed(0)} against average loss ${loss.toFixed(0)}`}
    >
      <div className="bg-profit" style={{ width: `${winPct}%` }} />
      <div className="bg-loss" style={{ width: `${100 - winPct}%` }} />
    </div>
  );
}

/**
 * 0-100 track with a marker. Deliberately a single hue ramped by lightness
 * rather than a red-to-green gradient: those two colours already mean "money"
 * everywhere else in this app, and reusing them here would misread as P&L.
 */
export function ScoreMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div
        className="relative h-2 w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--color-accent-soft) 0%, var(--color-accent-border) 45%, var(--color-accent) 100%)",
        }}
        role="img"
        aria-label={`Score ${pct.toFixed(0)} out of 100`}
      >
        <div
          className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-faint">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
