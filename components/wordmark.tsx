import { cn } from "@/lib/utils";

/*
 * Brand mark for TradeLog.
 *
 * Deliberately not the fintech default of an ascending arrow — that mark is on
 * every broker and every dashboard template, this app's own placeholder
 * included. The subject here is a *journal* of trades, so the mark reads as a
 * ledger: a bound spine on the left, then two candlesticks stepping up out of
 * it. Chart and record in one shape.
 *
 * Drawn as inline SVG rather than a file so it inherits the accent token and
 * stays correct in both themes without shipping two assets.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" className="fill-accent" />

      {/* Ledger spine. */}
      <rect
        x="7"
        y="8"
        width="2.5"
        height="16"
        rx="1.25"
        className="fill-on-accent"
        opacity="0.45"
      />

      {/* First candle: wick behind, body in front. */}
      <rect
        x="14.4"
        y="9"
        width="1.2"
        height="14"
        rx="0.6"
        className="fill-on-accent"
        opacity="0.55"
      />
      <rect
        x="12.5"
        y="12"
        width="5"
        height="8"
        rx="1.6"
        className="fill-on-accent"
      />

      {/* Second candle, stepped up. */}
      <rect
        x="22.4"
        y="6"
        width="1.2"
        height="14"
        rx="0.6"
        className="fill-on-accent"
        opacity="0.55"
      />
      <rect
        x="20.5"
        y="8"
        width="5"
        height="9"
        rx="1.6"
        className="fill-on-accent"
      />
    </svg>
  );
}

/**
 * Mark plus name. The accent lands on "Log" so the brand colour appears in the
 * wordmark itself rather than only in the tile beside it.
 */
export function Wordmark({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight text-foreground",
          textClassName
        )}
      >
        Trade<span className="text-accent">Log</span>
      </span>
    </span>
  );
}
