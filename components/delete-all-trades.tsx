"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteAllTrades } from "@/lib/actions/danger";
import { initialDangerState } from "@/lib/actions/state";

export function DeleteAllTrades({ tradeCount }: { tradeCount: number }) {
  const [state, formAction, pending] = useActionState(
    deleteAllTrades,
    initialDangerState
  );
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const confirmed = typed.trim() === "DELETE";

  return (
    <div className="rounded-2xl border border-loss/30 bg-loss/[0.04] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-loss/12 text-loss">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
            Delete all trades
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently removes all {tradeCount} logged{" "}
            {tradeCount === 1 ? "trade" : "trades"} and their uploaded chart
            screenshots. Your playbooks, journal entries, and market reviews are
            untouched. This cannot be undone.
          </p>

          {state.deleted !== null ? (
            <p
              role="status"
              className="mt-3 rounded-xl bg-profit/10 px-3 py-2 text-sm text-profit"
            >
              Deleted {state.deleted}{" "}
              {state.deleted === 1 ? "trade" : "trades"}.
            </p>
          ) : null}

          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={tradeCount === 0}
              className="mt-4 flex min-h-10 items-center gap-2 rounded-xl border border-loss/40 px-4 text-sm font-semibold text-loss hover:bg-loss/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {tradeCount === 0 ? "No trades to delete" : "Delete all trades"}
            </button>
          ) : (
            <form action={formAction} className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="confirm-delete"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Type <span className="font-semibold text-loss">DELETE</span> to
                  confirm
                </label>
                <input
                  id="confirm-delete"
                  name="confirm"
                  type="text"
                  autoComplete="off"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="min-h-10 w-full max-w-56 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {state.error ? (
                <p role="alert" className="text-sm text-loss">
                  {state.error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={!confirmed || pending}
                  className="flex min-h-10 items-center gap-2 rounded-xl bg-loss px-4 text-sm font-semibold text-loss-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {pending ? "Deleting…" : `Delete ${tradeCount}`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setTyped("");
                  }}
                  className="flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
