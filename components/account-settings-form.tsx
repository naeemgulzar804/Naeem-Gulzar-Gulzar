"use client";

import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { saveSettings } from "@/lib/actions/settings";
import { initialSettingsFormState } from "@/lib/actions/state";
import type { AccountSettings } from "@/lib/types";

const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";
const fieldCls =
  "min-h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function NumField({
  id,
  label,
  hint,
  defaultValue,
  step = "any",
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  defaultValue: number | null;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input
        id={id}
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
  settings,
}: {
  settings: AccountSettings;
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
      <p className="mb-4 text-sm text-muted-foreground">
        The equity curve starts from your balance, and the dashboard measures
        how close you are to each limit. Leave a limit blank to not track it.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumField
          id="startingBalance"
          label="Account size"
          defaultValue={settings.startingBalance}
          placeholder="50000"
          hint="What the equity curve starts from."
        />
        <NumField
          id="dailyLossLimit"
          label="Daily loss limit ($)"
          defaultValue={settings.dailyLossLimit}
          placeholder="Not tracked"
        />
        <NumField
          id="maxDrawdown"
          label="Max drawdown ($)"
          defaultValue={settings.maxDrawdown}
          placeholder="Not tracked"
          hint="Measured from your highest balance, not your starting one."
        />
        <NumField
          id="profitTarget"
          label="Profit target ($)"
          defaultValue={settings.profitTarget}
          placeholder="Not tracked"
        />
      </div>

      <h3 className="mb-3 mt-6 font-display text-[13px] font-bold tracking-tight text-foreground">
        Your rules
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumField
          id="riskPctAligned"
          label="Risk % — Daily aligned"
          defaultValue={settings.riskPctAligned}
          step="0.05"
        />
        <NumField
          id="riskPctUnaligned"
          label="Risk % — not aligned"
          defaultValue={settings.riskPctUnaligned}
          step="0.05"
        />
        <NumField
          id="maxLossesPerDay"
          label="Stop after N losses"
          defaultValue={settings.maxLossesPerDay}
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
          {pending ? "Saving…" : "Save settings"}
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
