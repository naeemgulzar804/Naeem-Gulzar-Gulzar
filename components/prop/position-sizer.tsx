"use client";

import { useMemo, useState } from "react";
import { Calculator, TriangleAlert } from "lucide-react";
import { FRAMEWORK, type Tier } from "@/lib/prop-framework";
import { defaultTargetPct, planSizing } from "@/lib/prop-firm";
import { cn } from "@/lib/utils";

export interface SizerAccount {
  id: string;
  name: string;
  size: number;
  balance: number;
  tier: Tier;
  targetPct: number;
}

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const field =
  "min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const label = "mb-1 block text-[11px] font-medium text-muted-foreground";

function Num({
  id,
  title,
  value,
  onChange,
  step = "any",
  hint,
}: {
  id: string;
  title: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {title}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      />
      {hint ? <p className="mt-1 text-[10px] text-faint">{hint}</p> : null}
    </div>
  );
}

/**
 * The rapid-pass calculator. It answers the one question the framework leaves
 * as arithmetic: given where this evaluation actually sits, what do I risk on
 * the next trade — and at what point does the maths say cut instead.
 */
export function PositionSizer({ accounts }: { accounts: SizerAccount[] }) {
  const [selected, setSelected] = useState(accounts[0]?.id ?? "");
  const account = accounts.find((a) => a.id === selected);

  const [manualSize, setManualSize] = useState("25000");
  const [manualBalance, setManualBalance] = useState("25000");
  const [manualTier, setManualTier] = useState<Tier>(3);
  const [targetPct, setTargetPct] = useState("");
  const [wins, setWins] = useState("2");
  const [rr, setRr] = useState(String(FRAMEWORK.minRiskReward));
  const [stopPips, setStopPips] = useState("");
  const [pipValue, setPipValue] = useState("10");

  const size = account ? account.size : Number(manualSize) || 0;
  const balance = account ? account.balance : Number(manualBalance) || 0;
  const tier = account ? account.tier : manualTier;
  const effectiveTarget =
    Number(targetPct) ||
    (account ? account.targetPct : defaultTargetPct(tier === 3 ? "phase1" : tier === 2 ? "phase2" : "funded"));

  const plan = useMemo(
    () =>
      planSizing({
        accountSize: size,
        currentBalance: balance,
        tier,
        profitTargetPct: effectiveTarget,
        winsToPass: Number(wins) || 1,
        riskReward: Number(rr) || FRAMEWORK.minRiskReward,
        stopPips: Number(stopPips) || null,
        pipValuePerLot: Number(pipValue) || 10,
      }),
    [size, balance, tier, effectiveTarget, wins, rr, stopPips, pipValue]
  );

  return (
    <section aria-labelledby="sizer-heading" className="card">
      <div className="mb-1 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-accent" aria-hidden="true" />
        <h2
          id="sizer-heading"
          className="font-display text-[13px] font-bold tracking-tight text-foreground"
        >
          Rapid-pass position sizer
        </h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Sizes the next trade from the balance and the drawdown you have left,
        at a minimum {FRAMEWORK.minRiskReward}:1. After a loss the account sits
        further from its target, so the same formula asks for slightly more —
        until a ceiling binds, which is the signal to cut and rebuy.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {accounts.length ? (
          <div className="col-span-2">
            <label htmlFor="sizer-account" className={label}>
              Account
            </label>
            <select
              id="sizer-account"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={cn(field, "cursor-pointer")}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  T{a.tier} · {a.name}
                </option>
              ))}
              <option value="">Manual entry…</option>
            </select>
          </div>
        ) : null}

        {!account ? (
          <>
            <Num
              id="sizer-size"
              title="Account size ($)"
              value={manualSize}
              onChange={setManualSize}
            />
            <Num
              id="sizer-balance"
              title="Current balance ($)"
              value={manualBalance}
              onChange={setManualBalance}
            />
            <div>
              <label htmlFor="sizer-tier" className={label}>
                Tier
              </label>
              <select
                id="sizer-tier"
                value={manualTier}
                onChange={(e) => setManualTier(Number(e.target.value) as Tier)}
                className={cn(field, "cursor-pointer")}
              >
                <option value={3}>T3 — Phase 1</option>
                <option value={2}>T2 — Phase 2</option>
                <option value={1}>T1 — Funded</option>
              </select>
            </div>
          </>
        ) : null}

        <Num
          id="sizer-target"
          title="Profit target (%)"
          value={targetPct}
          onChange={setTargetPct}
          hint={`Default ${effectiveTarget}%`}
        />
        <Num
          id="sizer-wins"
          title="Pass in N wins"
          value={wins}
          onChange={setWins}
          step="1"
          hint="The guide says 1 to 3"
        />
        <Num id="sizer-rr" title="Risk : reward" value={rr} onChange={setRr} />
        <Num
          id="sizer-stop"
          title="Stop (pips)"
          value={stopPips}
          onChange={setStopPips}
          hint="Optional — for lots"
        />
        <Num
          id="sizer-pip"
          title="$ per pip / lot"
          value={pipValue}
          onChange={setPipValue}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary/50 p-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-muted-foreground">Risk this trade</p>
          <p className="figure mt-1 text-[18px] font-bold leading-none text-foreground">
            {money(plan.riskPerTrade)}
          </p>
          <p className="mt-1 text-[10px] text-faint">
            {plan.riskPct.toFixed(2)}% of balance
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Target at {rr || 3}:1</p>
          <p className="figure mt-1 text-[18px] font-bold leading-none text-profit">
            {money(plan.rewardPerTrade)}
          </p>
          <p className="mt-1 text-[10px] text-faint">
            {money(plan.remainingProfit)} left to pass
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Lot size</p>
          <p className="figure mt-1 text-[18px] font-bold leading-none text-foreground">
            {plan.lots === null ? "—" : plan.lots.toFixed(2)}
          </p>
          <p className="mt-1 text-[10px] text-faint">
            {plan.lots === null ? "Enter a stop" : "Standard lots"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Losses left</p>
          <p className="figure mt-1 text-[18px] font-bold leading-none text-foreground">
            {plan.attemptsLeft}
          </p>
          <p className="mt-1 text-[10px] text-faint">
            {money(plan.buffer)} to the cut
          </p>
        </div>
      </div>

      {plan.warnings.length ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {plan.warnings.map((w) => (
            <li
              key={w}
              className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-[12px] text-muted-foreground"
            >
              <TriangleAlert
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              {w}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-muted-foreground">
          Bound by the profit target, not by the drawdown — the account has room
          to work with.
        </p>
      )}
    </section>
  );
}
