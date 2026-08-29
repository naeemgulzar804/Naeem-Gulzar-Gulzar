import { Banknote, Scissors, ShoppingCart, TrendingUp, Trash2 } from "lucide-react";
import { deletePropEventAction } from "@/lib/actions/prop-firm";
import type { PropEvent, PropEventKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

const KIND: Record<
  PropEventKind,
  { icon: typeof Banknote; label: string; cls: string; sign: string }
> = {
  payout: { icon: Banknote, label: "Payout", cls: "text-profit", sign: "+" },
  cut: { icon: Scissors, label: "Cut", cls: "text-loss", sign: "−" },
  purchase: { icon: ShoppingCart, label: "Eval bought", cls: "text-muted-foreground", sign: "−" },
  promotion: { icon: TrendingUp, label: "Promoted", cls: "text-accent", sign: "" },
};

/**
 * The payout and cut history. It is here because the scale-up gate reads from
 * it: a streak that looks wrong on this list is a gate that will read wrong.
 */
export function Ledger({ events }: { events: PropEvent[] }) {
  return (
    <section aria-labelledby="ledger-heading" className="card">
      <h2
        id="ledger-heading"
        className="font-display text-[13px] font-bold tracking-tight text-foreground"
      >
        Payout &amp; cut history
      </h2>

      {events.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Nothing recorded yet. Log a payout from an account card the moment it
          hits +3% — the scale-up gate counts them.
        </p>
      ) : (
        <ul className="mt-2 flex max-h-[420px] flex-col overflow-y-auto">
          {events.map((e) => {
            const kind = KIND[e.kind];
            const Icon = kind.icon;
            return (
              <li
                key={e.id}
                className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"
              >
                <Icon
                  className={cn("h-3.5 w-3.5 shrink-0", kind.cls)}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-foreground">
                    {kind.label}
                    {e.accountLabel ? ` · ${e.accountLabel}` : ""}
                  </p>
                  <p className="truncate text-[11px] text-faint">
                    {e.occurredOn}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                {e.amount > 0 ? (
                  <span className={cn("figure text-[12px] font-semibold", kind.cls)}>
                    {kind.sign}
                    {money(e.amount)}
                  </span>
                ) : null}
                <form action={deletePropEventAction}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <button
                    type="submit"
                    aria-label={`Delete ${kind.label.toLowerCase()} entry`}
                    className="rounded p-1 text-faint hover:text-loss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
