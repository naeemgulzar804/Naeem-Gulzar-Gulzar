import { ArrowDownRight, ArrowUpRight, Undo2 } from "lucide-react";
import type { ExcursionReport } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const R = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;

/**
 * What the excursion prices are for. Realized R says how a trade ended; these
 * say what it did on the way, which is where a fixed 1:3 target either gets
 * respected or quietly abandoned.
 */
export function ExcursionPanel({ report }: { report: ExcursionReport }) {
  if (report.recorded === 0) {
    return (
      <div className="card">
        <h2 className="mb-1 font-display text-[13px] font-bold tracking-tight text-foreground">
          On the way
        </h2>
        <p className="text-xs text-muted-foreground">
          Record the worst and best price each trade reached and this fills in:
          whether you are closing winners short of the target, how close your
          winners come to the stop, and how many losers were up a full R before
          they turned.
        </p>
      </div>
    );
  }

  const peak = report.avgWinnerPeakR;
  const close = report.avgWinnerCloseR;
  const leftOnTable = peak !== null && close !== null ? peak - close : null;

  return (
    <div className="card">
      <h2 className="mb-1 font-display text-[13px] font-bold tracking-tight text-foreground">
        On the way
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        What trades did before they closed, over {report.recorded} with the
        prices recorded.
      </p>

      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              {peak !== null && close !== null ? (
                <>
                  Winners peaked at{" "}
                  <span className="figure font-semibold text-profit">
                    {R(peak)}
                  </span>{" "}
                  and closed at{" "}
                  <span className="figure font-semibold">{R(close)}</span>
                </>
              ) : (
                "No winners with prices recorded yet."
              )}
            </p>
            {leftOnTable !== null && leftOnTable >= 0.3 ? (
              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                {R(leftOnTable)} per winner left on the table against a 1:3
                target.
              </p>
            ) : leftOnTable !== null ? (
              <p className="mt-0.5 text-xs text-faint">
                Winners are being held close to their peak.
              </p>
            ) : null}
          </div>
        </li>

        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              {report.avgWinnerMaeR !== null ? (
                <>
                  Winners dipped to{" "}
                  <span className="figure font-semibold text-loss">
                    {R(report.avgWinnerMaeR)}
                  </span>{" "}
                  first
                </>
              ) : (
                "No winners with prices recorded yet."
              )}
            </p>
            {report.avgWinnerMaeR !== null ? (
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  report.avgWinnerMaeR <= -0.7
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-faint"
                )}
              >
                {report.avgWinnerMaeR <= -0.7
                  ? "Your winners are surviving by a hair. A wider stop, or a later entry, would cost less than the ones this stops out."
                  : "Comfortable room between the entries and the stop."}
              </p>
            ) : null}
          </div>
        </li>

        <li className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              report.givenBack > 0
                ? "bg-loss/12 text-loss"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              <span className="figure font-semibold">{report.givenBack}</span>{" "}
              of {report.losersWithData}{" "}
              {report.losersWithData === 1 ? "loser was" : "losers were"} up a
              full R first
            </p>
            <p className="mt-0.5 text-xs text-faint">
              {report.givenBack > 0
                ? "These were winning trades you gave back. Worth reviewing what happened at +1R."
                : "No loser reached +1R before turning."}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
