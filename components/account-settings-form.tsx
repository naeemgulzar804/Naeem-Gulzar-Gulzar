"use client";

import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { saveSettings } from "@/lib/actions/settings";
import { initialSettingsFormState } from "@/lib/actions/state";
import type { Account } from "@/lib/types";
import { PHASE_LABEL, TIER_BY_PHASE } from "@/lib/prop-framework";

const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";
const fieldCls =
  "min-h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function NumField({
  id,
  scope,
  label,
  hint,
  defaultValue,
  step = "any",
  placeholder,
}: {
  id: string;
  scope: string;
  label: string;
  hint?: string;
  defaultValue: number | null;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`${id}-${scope}`} className={labelCls}>
        {label}
      </label>
      <input
        id={`${id}-${scope}`}
        name={id}
        type="number"
        step={step}
        min="0"
        inputMode="decimal"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={fieldCls}
      />
      {hint ? <p className="mt-1 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function AccountSettingsForm({
  account,
  isNew = false,
}: {
  account: Account;
  isNew?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveSettings,
    initialSettingsFormState
  );

  // Derived, not toggled on: only the dismissal is state.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const justSaved = state.savedAt !== null && state.savedAt !== dismissedAt;

  useEffect(() => {
    const at = state.savedAt;
    if (at === null) return;
    const t = setTimeout(() => setDismissedAt(at), 2500);
    return () => clearTimeout(t);
  }, [state.savedAt]);

  return (
    <form
      action={formAction}
      className="card"
    >
      <input type="hidden" name="accountId" value={isNew ? "" : account.id} />

      <p className="mb-4 text-sm text-muted-foreground">
        Where this account sits in the framework, what the firm allows, and
        the rules you hold yourself to. Leave a limit blank to not track it.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`name-${account.id}`} className={labelCls}>
            Account name
          </label>
          <input
            id={`name-${account.id}`}
            name="name"
            type="text"
            required
            defaultValue={account.name}
            placeholder="FTMO 100K — A"
            className={fieldCls}
          />
        </div>
        <div>
          <label htmlFor={`firm-${account.id}`} className={labelCls}>
            Prop firm
          </label>
          <input
            id={`firm-${account.id}`}
            name="firm"
            type="text"
            defaultValue={account.firm}
            placeholder="FTMO"
            className={fieldCls}
          />
        </div>
      </div>

      <h3 className="mb-3 mt-6 font-display text-[13px] font-bold tracking-tight text-foreground">
        3-Tier Framework
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`phase-${account.id}`} className={labelCls}>
            Phase
          </label>
          <select
            id={`phase-${account.id}`}
            name="phase"
            defaultValue={account.phase}
            className={fieldCls}
          >
            {(["funded", "phase2", "phase1"] as const).map((phase) => (
              <option key={phase} value={phase}>
                {PHASE_LABEL[phase]} — Tier {TIER_BY_PHASE[phase]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-faint">
            Sets the tier, and with it the cut trigger: −6% funded, −4% in
            either evaluation phase.
          </p>
        </div>
        <div>
          <label htmlFor={`cycleStart-${account.id}`} className={labelCls}>
            Cycle start date
          </label>
          <input
            id={`cycleStart-${account.id}`}
            name="cycleStart"
            type="date"
            defaultValue={account.cycleStart ?? ""}
            className={fieldCls}
          />
          <p className="mt-1 text-[11px] text-faint">
            Anchors the 4-weeks-on / 1-week-off cycle. Give every funded
            account a different date — that is the staggering.
          </p>
        </div>
        <NumField
          scope={account.id}
          id="currentBalance"
          label="Current balance ($)"
          defaultValue={account.currentBalance}
          placeholder="From logged trades"
          hint="Leave blank to track it from the trades you log here."
        />
        <NumField
          scope={account.id}
          id="programCost"
          label="Evaluation fee ($)"
          defaultValue={account.programCost}
          placeholder="Not tracked"
          hint="What a rebuy costs after a cut."
        />
        <div>
          <label htmlFor={`drawdownBasis-${account.id}`} className={labelCls}>
            Drawdown measured from
          </label>
          <select
            id={`drawdownBasis-${account.id}`}
            name="drawdownBasis"
            defaultValue={account.drawdownBasis}
            className={fieldCls}
          >
            <option value="initial">Starting balance (static)</option>
            <option value="peak">Highest balance (trailing)</option>
          </select>
        </div>
        <label className="flex items-start gap-2.5 self-end pb-1 text-sm text-foreground">
          <input
            type="checkbox"
            name="inFramework"
            defaultChecked={account.inFramework}
            className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--color-accent)]"
          />
          <span>
            Count in the tier ratios
            <span className="mt-0.5 block text-[11px] text-faint">
              Uncheck for a personal or live account.
            </span>
          </span>
        </label>
      </div>

      <h3 className="mb-3 mt-6 font-display text-[13px] font-bold tracking-tight text-foreground">
        Size &amp; firm limits
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumField
          scope={account.id}
          id="startingBalance"
          label="Account size"
          defaultValue={account.startingBalance}
          placeholder="50000"
          hint="What the equity curve starts from."
        />
        <NumField
          scope={account.id}
          id="dailyLossLimit"
          label="Daily loss limit ($)"
          defaultValue={account.dailyLossLimit}
          placeholder="Not tracked"
        />
        <NumField
          scope={account.id}
          id="maxDrawdown"
          label="Max drawdown ($)"
          defaultValue={account.maxDrawdown}
          placeholder="Not tracked"
          hint="Measured from your highest balance, not your starting one."
        />
        <NumField
          scope={account.id}
          id="profitTarget"
          label="Profit target ($)"
          defaultValue={account.profitTarget}
          placeholder="Not tracked"
        />
      </div>

      <h3 className="mb-3 mt-6 font-display text-[13px] font-bold tracking-tight text-foreground">
        Your rules
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumField
          scope={account.id}
          id="riskPctAligned"
          label="Risk % — Daily aligned"
          defaultValue={account.riskPctAligned}
          step="0.05"
        />
        <NumField
          scope={account.id}
          id="riskPctUnaligned"
          label="Risk % — not aligned"
          defaultValue={account.riskPctUnaligned}
          step="0.05"
        />
        <NumField
          scope={account.id}
          id="maxLossesPerDay"
          label="Stop after N losses"
          defaultValue={account.maxLossesPerDay}
          step="1"
        />
      </div>
      <p className="mt-2 text-[11px] text-faint">
        These drive the sizing warning on the trade form and the discipline
        stats on Analytics.
      </p>

      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-loss">
          {state.error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : isNew ? "Add account" : "Save account"}
        </button>
        {justSaved ? (
          <span
            role="status"
            className="flex items-center gap-1.5 text-sm text-profit"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
