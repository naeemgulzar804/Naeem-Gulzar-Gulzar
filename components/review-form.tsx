"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Sunrise, Sunset } from "lucide-react";
import { saveReview } from "@/lib/actions/reviews";
import { initialReviewFormState } from "@/lib/actions/state";
import { MARKET_BIASES, PLAN_ADHERENCE } from "@/lib/types";
import type { MarketReview, ReviewKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";
const fieldCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ReviewForm({
  kind,
  date,
  existing,
}: {
  kind: ReviewKind;
  date: string;
  existing: MarketReview | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveReview,
    initialReviewFormState
  );
  // The confirmation is derived, not toggled on: only the dismissal is
  // state, which keeps this out of a set-state-during-effect.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const justSaved = state.savedAt !== null && state.savedAt !== dismissedAt;

  useEffect(() => {
    const at = state.savedAt;
    if (at === null) return;
    const t = setTimeout(() => setDismissedAt(at), 2500);
    return () => clearTimeout(t);
  }, [state.savedAt]);

  const isPre = kind === "pre";
  const Icon = isPre ? Sunrise : Sunset;

  return (
    <form
      action={formAction}
      className="h-fit card"
    >
      <input type="hidden" name="kind" value={kind} />

      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-[13px] font-bold tracking-tight text-foreground">
            {isPre ? "Pre-market plan" : "Post-market review"}
          </h2>
          <p className="text-xs text-faint">
            {isPre
              ? "Write this before the session opens."
              : "Fill this in after you stop trading."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor={`${kind}-date`} className={labelCls}>
            Date
          </label>
          <input
            id={`${kind}-date`}
            name="date"
            type="date"
            required
            defaultValue={date}
            className={cn(fieldCls, "sm:max-w-56")}
          />
        </div>

        {isPre ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bias" className={labelCls}>
                  Daily bias
                </label>
                <select
                  id="bias"
                  name="bias"
                  defaultValue={existing?.bias ?? ""}
                  className={fieldCls}
                >
                  <option value="">Undecided</option>
                  {MARKET_BIASES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="watchlist" className={labelCls}>
                  Watchlist
                </label>
                <input
                  id="watchlist"
                  name="watchlist"
                  type="text"
                  placeholder="EURUSD, GBPUSD, XAUUSD"
                  defaultValue={existing?.watchlist.join(", ") ?? ""}
                  className={fieldCls}
                />
              </div>
            </div>

            <Area id="keyLevels" label="Key levels" placeholder="Highs, lows, dealing range, OBs you're watching…" defaultValue={existing?.keyLevels} />
            <Area id="newsEvents" label="News & events" placeholder="Red-folder news, session times to avoid…" defaultValue={existing?.newsEvents} />
            <Area id="plan" label="Plan — what setups am I taking?" placeholder="Only A+ liquidity sweeps in the London kill zone…" defaultValue={existing?.plan} rows={3} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Area id="riskPlan" label="Risk plan" placeholder="1% per trade, stop after 2 losses" defaultValue={existing?.riskPlan} />
              <Area id="mentalState" label="Mental state" placeholder="Rested? Distracted? Anything off today?" defaultValue={existing?.mentalState} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="followedPlan" className={labelCls}>
                  Did I follow my plan?
                </label>
                <select
                  id="followedPlan"
                  name="followedPlan"
                  defaultValue={existing?.followedPlan ?? ""}
                  className={fieldCls}
                >
                  <option value="">Not answered</option>
                  {PLAN_ADHERENCE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="disciplineRating" className={labelCls}>
                  Discipline rating (1–10)
                </label>
                <input
                  id="disciplineRating"
                  name="disciplineRating"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="7"
                  defaultValue={existing?.disciplineRating ?? ""}
                  className={fieldCls}
                />
              </div>
            </div>

            <Area id="whatWentWell" label="What went well" placeholder="Waited for confirmation, sized correctly…" defaultValue={existing?.whatWentWell} />
            <Area id="whatWentWrong" label="What went wrong" placeholder="Entered early, moved my stop…" defaultValue={existing?.whatWentWrong} />
            <Area id="lessons" label="Lessons — what changes tomorrow?" placeholder="No trades before the 3 AM candle closes." defaultValue={existing?.lessons} rows={3} />
          </>
        )}

        <Area id="notes" label="Additional notes" placeholder="Anything else worth remembering." defaultValue={existing?.notes} />
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-xl bg-loss/10 px-3 py-2 text-sm text-loss">
          {state.error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : existing ? "Update" : "Save"}
        </button>
        {justSaved ? (
          <span role="status" className="flex items-center gap-1.5 text-sm text-profit">
            <Check className="h-4 w-4" aria-hidden="true" />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Area({
  id,
  label,
  placeholder,
  defaultValue,
  rows = 2,
}: {
  id: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className={cn(fieldCls, "resize-y")}
      />
    </div>
  );
}
