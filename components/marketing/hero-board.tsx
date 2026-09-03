import { cn } from "@/lib/utils";

/*
 * The hero's thesis: the product's most characteristic view, not a stock
 * gradient or a floating phone. A trader recognises a month of coloured P&L
 * immediately, so the calendar does the explaining that a paragraph would
 * otherwise have to.
 *
 * Static by design — this is a picture of the app, not a live instance. The
 * figures are illustrative sample data, and the caption says so rather than
 * letting the numbers read as anyone's real results.
 */

const STATS = [
  { label: "Net P&L", value: "+$7,183", tone: "profit" as const },
  { label: "Win rate", value: "45.2%", tone: "neutral" as const },
  { label: "Profit factor", value: "2.22", tone: "neutral" as const },
  { label: "Account score", value: "83.0", tone: "accent" as const },
];

/* Day-of-month → P&L for the sample month. Gaps are days with no trades. */
const DAYS: Record<number, number> = {
  5: 1050,
  10: 600,
  11: 1090,
  13: -638,
  14: 556,
  17: -788,
  18: 875,
  19: 608,
  20: 1180,
  21: 113,
  24: 225,
  25: 300,
  26: -38,
};

const FIRST_WEEKDAY = 6; // the 1st falls on a Saturday
const DAYS_IN_MONTH = 30;

function cellTone(pnl: number | undefined) {
  if (pnl === undefined) return "border-border bg-card text-faint";
  if (pnl >= 0) {
    return pnl > 800
      ? "border-transparent bg-profit/35 text-profit"
      : "border-transparent bg-profit/15 text-profit";
  }
  return pnl < -600
    ? "border-transparent bg-loss/30 text-loss"
    : "border-transparent bg-loss/15 text-loss";
}

function compact(pnl: number) {
  const sign = pnl >= 0 ? "+" : "-";
  const abs = Math.abs(pnl);
  return abs >= 1000
    ? `${sign}$${(abs / 1000).toFixed(1)}k`
    : `${sign}$${Math.round(abs)}`;
}

export function HeroBoard() {
  const cells: (number | null)[] = [
    ...Array.from({ length: FIRST_WEEKDAY }, () => null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];

  return (
    <figure className="mx-auto m-0 w-full max-w-4xl">
      <div className="card overflow-hidden p-0 shadow-[0_24px_60px_-30px_rgba(20,20,27,0.35)]">
        {/* Window chrome, so the panel reads as a screen rather than a widget. */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          </span>
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            Dashboard · June
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {s.label}
                </p>
                <p
                  className={cn(
                    "figure mt-1 text-[17px] font-bold leading-none sm:text-[19px]",
                    s.tone === "profit" && "text-profit",
                    s.tone === "accent" && "text-accent",
                    s.tone === "neutral" && "text-foreground"
                  )}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={`${d}-${i}`}
                className="pb-1 text-center text-[10px] font-medium text-faint"
              >
                {d}
              </div>
            ))}

            {cells.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />;
              const pnl = DAYS[day];
              return (
                <div
                  key={day}
                  className={cn(
                    /* Fixed height rather than aspect-square: at full width a
                       square cell is ~200px tall and the month stops reading
                       as a month. */
                    "flex h-11 flex-col items-center justify-center rounded-lg border px-1 sm:h-14",
                    cellTone(pnl)
                  )}
                >
                  <span className="text-[10px] leading-none opacity-70">{day}</span>
                  {pnl !== undefined ? (
                    <span className="figure mt-1 text-[10px] font-semibold leading-none sm:text-[11px]">
                      {compact(pnl)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-faint">
        Sample data shown for illustration.
      </figcaption>
    </figure>
  );
}
