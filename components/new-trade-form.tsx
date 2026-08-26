"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { Playbook } from "@/lib/types";
import { addTrade } from "@/lib/actions/trades";
import { initialTradeFormState } from "@/lib/actions/state";

export function NewTradeForm({ playbooks }: { playbooks: Playbook[] }) {
  const [state, formAction, pending] = useActionState(
    addTrade,
    initialTradeFormState
  );
  const [pnl, setPnl] = useState("");
  const [riskAmount, setRiskAmount] = useState("250");

  const rMultiple = useMemo(() => {
    const p = Number(pnl);
    const r = Number(riskAmount);
    if (!Number.isFinite(p) || !Number.isFinite(r) || r <= 0) return null;
    return p / r;
  }, [pnl, riskAmount]);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date" id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        <Field label="Symbol" id="symbol" name="symbol" type="text" required placeholder="EURUSD" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="side" className="mb-1.5 block text-sm font-medium text-foreground">
            Side
          </label>
          <select
            id="side"
            name="side"
            defaultValue="long"
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label htmlFor="grade" className="mb-1.5 block text-sm font-medium text-foreground">
            Grade
          </label>
          <select
            id="grade"
            name="grade"
            defaultValue="B"
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="A+">A+</option>
            <option value="B">B</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="playbook" className="mb-1.5 block text-sm font-medium text-foreground">
          Playbook
        </label>
        {playbooks.length ? (
          <select
            id="playbook"
            name="playbook"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Select a playbook
            </option>
            {playbooks.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="playbook"
            name="playbook"
            type="text"
            required
            placeholder="e.g. Liquidity Sweep + FVG"
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Entry price" id="entryPrice" name="entryPrice" type="number" step="any" />
        <Field label="Exit price" id="exitPrice" name="exitPrice" type="number" step="any" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Size (lots)" id="size" name="size" type="number" step="any" />
        <Field label="Duration (minutes)" id="durationMinutes" name="durationMinutes" type="number" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Risk amount ($, 1R)"
          id="riskAmount"
          name="riskAmount"
          type="number"
          step="any"
          value={riskAmount}
          onChange={(e) => setRiskAmount(e.target.value)}
        />
        <Field
          label="P&L ($)"
          id="pnl"
          name="pnl"
          type="number"
          step="any"
          required
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        R multiple:{" "}
        <span className="font-mono text-foreground">
          {rMultiple === null ? "—" : `${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R`}
        </span>{" "}
        <span className="text-xs">(computed automatically from P&L ÷ risk amount)</span>
      </p>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-foreground">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="What was the setup, what went right or wrong..."
          className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 items-center justify-center rounded-lg bg-profit px-5 text-sm font-semibold text-profit-foreground hover:bg-profit/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save trade"}
        </button>
        <Link
          href="/trades"
          className="flex min-h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  name,
  type,
  required,
  placeholder,
  step,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  id: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
