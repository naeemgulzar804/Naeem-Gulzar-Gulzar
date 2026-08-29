import { CUT_PLAYBOOK, FRAMEWORK, REINVEST_LADDER } from "@/lib/prop-framework";
import type { PropReport } from "@/lib/prop-firm";
import { cn } from "@/lib/utils";

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`;

const th =
  "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-3 py-2 text-[12px] text-muted-foreground";

/** Which account size is unlocked, and exactly what is still in the way. */
export function UpgradeLadder({ report }: { report: PropReport }) {
  return (
    <section aria-labelledby="ladder-heading" className="card">
      <h2
        id="ladder-heading"
        className="font-display text-[13px] font-bold tracking-tight text-foreground"
      >
        Account size ladder
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        You are cleared to trade{" "}
        <span className="font-semibold text-foreground">
          ${report.unlockedSize.toLocaleString("en-US")}
        </span>{" "}
        accounts. Never more than{" "}
        {Math.round(FRAMEWORK.maxShareInUnprovenSize * 100)}% of T1 in a size
        you have not traded consistently.
      </p>

      <div className="mt-3 -mx-1 overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Size</th>
              <th className={th}>Needs T1</th>
              <th className={th}>Payouts</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.ladder.map((rung) => (
              <tr
                key={rung.size}
                className={cn(
                  "border-b border-border last:border-b-0",
                  rung.current && "bg-accent-soft"
                )}
              >
                <td className={cn(td, "figure font-semibold text-foreground")}>
                  {money(rung.size)}
                </td>
                <td className={cn(td, "figure")}>
                  {rung.minT1 ? money(rung.minT1) : "—"}
                </td>
                <td className={cn(td, "figure")}>{rung.minPayouts || "—"}</td>
                <td className={td}>
                  {rung.unlocked ? (
                    <span className="font-semibold text-profit">
                      {rung.current ? "Current" : "Unlocked"}
                    </span>
                  ) : (
                    <span className="text-faint">{rung.blockers[0]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-faint">
        {report.ladder.find((r) => r.current)?.condition}
      </p>
    </section>
  );
}

/** The reinvestment ladder, with the stage you are actually in highlighted. */
export function ReinvestLadder({ report }: { report: PropReport }) {
  return (
    <section aria-labelledby="reinvest-heading" className="card">
      <h2
        id="reinvest-heading"
        className="font-display text-[13px] font-bold tracking-tight text-foreground"
      >
        Reinvestment ladder
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        The reinvestment rate falls as the system matures — growth mode into
        income mode.
      </p>

      <div className="mt-3 -mx-1 overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Stage</th>
              <th className={th}>T1 range</th>
              <th className={th}>Reinvest</th>
              <th className={th}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {REINVEST_LADDER.map((s) => (
              <tr
                key={s.stage}
                className={cn(
                  "border-b border-border last:border-b-0",
                  s.stage === report.stage.stage && "bg-accent-soft"
                )}
              >
                <td className={cn(td, "font-semibold text-foreground")}>
                  {s.stage} — {s.name}
                </td>
                <td className={cn(td, "figure")}>
                  {money(s.t1From)} →{" "}
                  {s.t1To === Infinity ? "beyond" : money(s.t1To)}
                </td>
                <td className={cn(td, "figure font-semibold text-foreground")}>
                  {s.reinvestPct}%
                </td>
                <td className={td}>{s.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The cut triggers, always visible — this is the table you act from. */
export function CutReference() {
  return (
    <section aria-labelledby="cuts-heading" className="card">
      <h2
        id="cuts-heading"
        className="font-display text-[13px] font-bold tracking-tight text-foreground"
      >
        When to cut
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Cutting is not failure — it is a predetermined cost. The evaluation fee
        is a known number; the loss from fighting an account back is not.
      </p>

      <ul className="mt-3 flex flex-col">
        {([1, 2, 3] as const).map((tier) => (
          <li
            key={tier}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border py-2 last:border-b-0"
          >
            <span className="figure text-[12px] font-bold text-loss">
              −{FRAMEWORK.cutTriggerPct[tier]}%
            </span>
            <span className="text-[12px] font-semibold text-foreground">
              Tier {tier}
            </span>
            <span className="w-full text-[11px] text-muted-foreground sm:w-auto sm:flex-1">
              {CUT_PLAYBOOK[tier]}
            </span>
          </li>
        ))}
        <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
          <span className="figure text-[12px] font-bold text-amber-500">
            4wk
          </span>
          <span className="text-[12px] font-semibold text-foreground">
            Any tier
          </span>
          <span className="w-full text-[11px] text-muted-foreground sm:w-auto sm:flex-1">
            A cycle that ends in loss goes offline for one full week before it
            trades again.
          </span>
        </li>
      </ul>
    </section>
  );
}
