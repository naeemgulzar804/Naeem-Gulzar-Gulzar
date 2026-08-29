"use client";

import { useActionState, useState } from "react";
import { ArrowUpRight, Banknote, Scissors, X } from "lucide-react";
import { logPropEvent, promoteAccountAction } from "@/lib/actions/prop-firm";
import { initialPropFirmActionState } from "@/lib/actions/state";
import { PHASE_LABEL } from "@/lib/prop-framework";
import type { PropPhase } from "@/lib/prop-framework";
import { cn } from "@/lib/utils";

const btn =
  "flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const field =
  "min-h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Panel = "payout" | "cut" | null;

/**
 * The three things you ever do to a prop account: take the payout, cut it, or
 * move it up a phase. Promotion is a single button rather than a phase picker
 * because the framework only ever moves an account one step at a time.
 */
export function AccountActions({
  accountId,
  accountLabel,
  phase,
  suggestedPayout,
  today,
}: {
  accountId: string;
  accountLabel: string;
  phase: PropPhase;
  /** 3% of account size — the framework's payout lock. */
  suggestedPayout: number;
  today: string;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [eventState, logEvent, logging] = useActionState(
    logPropEvent,
    initialPropFirmActionState
  );
  const [promoteState, promote, promoting] = useActionState(
    promoteAccountAction,
    initialPropFirmActionState
  );

  const nextPhase: PropPhase | null =
    phase === "phase1" ? "phase2" : phase === "phase2" ? "funded" : null;
  const error = eventState.error ?? promoteState.error;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {phase === "funded" ? (
          <button
            type="button"
            onClick={() => setPanel(panel === "payout" ? null : "payout")}
            aria-expanded={panel === "payout"}
            className={cn(btn, panel === "payout" && "text-foreground")}
          >
            <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
            Log payout
          </button>
        ) : null}

        {nextPhase ? (
          <form action={promote}>
            <input type="hidden" name="accountId" value={accountId} />
            <input type="hidden" name="accountLabel" value={accountLabel} />
            <input type="hidden" name="phase" value={nextPhase} />
            <button type="submit" disabled={promoting} className={btn}>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              {promoting ? "Promoting…" : `Passed → ${PHASE_LABEL[nextPhase]}`}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => setPanel(panel === "cut" ? null : "cut")}
          aria-expanded={panel === "cut"}
          className={cn(btn, "hover:text-loss", panel === "cut" && "text-loss")}
        >
          <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
          Cut &amp; rebuy
        </button>
      </div>

      {panel ? (
        <form action={logEvent} className="mt-3 rounded-xl bg-secondary/50 p-3">
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="accountLabel" value={accountLabel} />
          <input type="hidden" name="kind" value={panel} />

          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              {panel === "payout"
                ? "Record the payout"
                : "Cut this account and archive it"}
            </p>
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close"
              className="rounded p-1 text-faint hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="sm:col-span-1">
              <span className="mb-1 block text-[11px] text-muted-foreground">
                {panel === "payout" ? "Amount ($)" : "Rebuy cost ($)"}
              </span>
              <input
                name="amount"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                defaultValue={
                  panel === "payout" ? Math.round(suggestedPayout) : ""
                }
                placeholder="0"
                className={field}
              />
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1 block text-[11px] text-muted-foreground">
                Date
              </span>
              <input
                name="occurredOn"
                type="date"
                defaultValue={today}
                className={field}
              />
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1 block text-[11px] text-muted-foreground">
                Note
              </span>
              <input
                name="note"
                type="text"
                placeholder="Optional"
                className={field}
              />
            </label>
          </div>

          {panel === "cut" ? (
            <p className="mt-2 text-[11px] text-faint">
              The account is archived, not deleted — its trades keep their
              history, and it drops out of the tier totals.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={logging}
            className={cn(
              "mt-3 flex min-h-9 items-center rounded-lg px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              panel === "cut"
                ? "bg-loss text-loss-foreground"
                : "bg-accent text-on-accent hover:bg-accent-hover"
            )}
          >
            {logging
              ? "Saving…"
              : panel === "payout"
                ? "Record payout"
                : "Confirm cut"}
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}
