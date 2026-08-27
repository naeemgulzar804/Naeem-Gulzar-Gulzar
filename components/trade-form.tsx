"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Hourglass, Target } from "lucide-react";
import {
  ChipMultiSelect,
  Field,
  FormSection,
  PillSelect,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/form-fields";
import {
  ScreenshotUploader,
  type ScreenshotPaths,
} from "@/components/screenshot-uploader";
import { saveTrade } from "@/lib/actions/trades";
import { initialTradeFormState } from "@/lib/actions/state";
import type { Playbook, Trade } from "@/lib/types";
import {
  CONFLUENCES,
  EMOTIONS,
  ENTRY_MODELS,
  ENTRY_TIMES,
  H4_CANDLES,
  PAIRS,
  SESSIONS,
  SETUP_GRADES,
  STRATEGIES,
  TIMEFRAMES,
  WEEKDAYS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface FormState {
  date: string;
  symbol: string;
  day: string;
  session: string;
  timeframe: string;
  playbook: string;
  dailyBias: string;
  side: string;
  marketCondition: string;
  h4Candle: string;
  liquidityPurge: string;
  entryModel: string;
  entryTime: string;
  grade: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  exitPrice: string;
  size: string;
  riskAmount: string;
  riskPct: string;
  durationMinutes: string;
  result: string;
  confluences: string[];
  emotionBefore: string;
  emotionDuring: string;
  emotionAfter: string;
  confidence: number;
  entryReason: string;
  exitReason: string;
  mistakes: string;
  lessons: string;
  notes: string;
}

function initialForm(trade?: Trade): FormState {
  if (!trade) {
    return {
      date: new Date().toISOString().slice(0, 10),
      symbol: "",
      day: "",
      session: "",
      timeframe: "",
      playbook: "",
      dailyBias: "",
      side: "",
      marketCondition: "",
      h4Candle: "",
      liquidityPurge: "",
      entryModel: "",
      entryTime: "",
      grade: "",
      entryPrice: "",
      stopLoss: "",
      takeProfit: "",
      exitPrice: "",
      size: "",
      riskAmount: "250",
      riskPct: "",
      durationMinutes: "",
      result: "",
      confluences: [],
      emotionBefore: "",
      emotionDuring: "",
      emotionAfter: "",
      confidence: 5,
      entryReason: "",
      exitReason: "",
      mistakes: "",
      lessons: "",
      notes: "",
    };
  }
  const num = (n: number) => (n ? String(n) : "");
  return {
    date: trade.date,
    symbol: trade.symbol,
    day: trade.day,
    session: trade.session,
    timeframe: trade.timeframe,
    playbook: trade.playbook,
    dailyBias: trade.dailyBias,
    side: trade.side === "long" ? "Long" : trade.side === "short" ? "Short" : "",
    marketCondition: trade.marketCondition,
    h4Candle: trade.h4Candle,
    liquidityPurge:
      trade.liquidityPurge === null ? "" : trade.liquidityPurge ? "Yes" : "No",
    entryModel: trade.entryModel,
    entryTime: trade.entryTime,
    grade: trade.grade,
    entryPrice: num(trade.entryPrice),
    stopLoss: num(trade.stopLoss),
    takeProfit: num(trade.takeProfit),
    exitPrice: num(trade.exitPrice),
    size: num(trade.size),
    riskAmount: num(trade.riskAmount),
    riskPct: num(trade.riskPct),
    durationMinutes: num(trade.durationMinutes),
    result: trade.result,
    confluences: trade.confluences,
    emotionBefore: trade.emotionBefore,
    emotionDuring: trade.emotionDuring,
    emotionAfter: trade.emotionAfter,
    confidence: trade.confidence ?? 5,
    entryReason: trade.entryReason,
    exitReason: trade.exitReason,
    mistakes: trade.mistakes,
    lessons: trade.lessons,
    notes: trade.notes,
  };
}

export function TradeForm({
  playbooks,
  trade,
}: {
  playbooks: Playbook[];
  trade?: Trade;
}) {
  const [state, formAction, pending] = useActionState(
    saveTrade,
    initialTradeFormState
  );
  const [form, setForm] = useState<FormState>(() => initialForm(trade));
  const [shots, setShots] = useState<ScreenshotPaths>({
    daily: trade?.screenshotDailyPath ?? null,
    h4: trade?.screenshotH4Path ?? null,
    "15m": trade?.screenshot15mPath ?? null,
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Derive the weekday automatically so day-of-week analytics stay honest.
      if (key === "date" && typeof value === "string" && value) {
        const weekday = new Date(`${value}T00:00:00Z`).toLocaleDateString(
          "en-US",
          { weekday: "long", timeZone: "UTC" }
        );
        if ((WEEKDAYS as readonly string[]).includes(weekday)) next.day = weekday;
      }
      return next;
    });
  }

  // Planned R:R from entry/stop/target, and realized R from the actual exit.
  const plannedRR = useMemo(() => {
    const e = parseFloat(form.entryPrice);
    const s = parseFloat(form.stopLoss);
    const t = parseFloat(form.takeProfit);
    if (!e || !s || !t) return null;
    const risk = Math.abs(e - s);
    return risk > 0 ? Math.abs(t - e) / risk : null;
  }, [form.entryPrice, form.stopLoss, form.takeProfit]);

  const realizedR = useMemo(() => {
    const e = parseFloat(form.entryPrice);
    const s = parseFloat(form.stopLoss);
    const x = parseFloat(form.exitPrice);
    if (!e || !s || !x) return null;
    const risk = Math.abs(e - s);
    if (risk <= 0) return null;
    const dir = form.side === "Short" ? -1 : 1;
    return ((x - e) * dir) / risk;
  }, [form.entryPrice, form.stopLoss, form.exitPrice, form.side]);

  const pnl = useMemo(() => {
    if (realizedR === null) return null;
    const risk = parseFloat(form.riskAmount);
    if (!risk) return null;
    return realizedR * risk;
  }, [realizedR, form.riskAmount]);

  const checklist: [string, boolean][] = [
    ["Pair selected", !!form.symbol],
    ["Daily bias set", !!form.dailyBias],
    ["H4 candle", !!form.h4Candle],
    ["Liquidity purge", form.liquidityPurge === "Yes"],
    ["Entry @ 3 AM", form.entryTime === "3 AM"],
    ["Quality = A+", form.grade === "A+"],
    ["3+ confluences", form.confluences.length >= 3],
    ["Entry price", !!form.entryPrice],
    ["Stop loss", !!form.stopLoss],
    ["Result set", !!form.result],
  ];
  const isAplus =
    form.confluences.length >= 3 &&
    form.liquidityPurge === "Yes" &&
    form.entryTime === "3 AM";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px] xl:items-start">
      {/* Values the server action reads. Kept as hidden inputs so the whole
          form posts as one payload without lifting every control into RSC. */}
      {trade ? <input type="hidden" name="id" value={trade.id} /> : null}
      {Object.entries({
        ...form,
        confluences: form.confluences.join("|"),
        confidence: String(form.confidence),
        plannedRR: plannedRR !== null ? plannedRR.toFixed(4) : "",
        rMultiple: realizedR !== null ? realizedR.toFixed(4) : "",
        pnl: pnl !== null ? pnl.toFixed(2) : "",
        screenshotDailyPath: shots.daily ?? "",
        screenshotH4Path: shots.h4 ?? "",
        screenshot15mPath: shots["15m"] ?? "",
      }).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}

      <div>
        <FormSection step={1} title="Trade Information">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectField label="Asset Pair" id="symbol" value={form.symbol} onChange={(v) => set("symbol", v)} options={PAIRS} />
            <TextField label="Date" id="date" type="date" value={form.date} onChange={(v) => set("date", v)} />
            <SelectField label="Day" id="day" value={form.day} onChange={(v) => set("day", v)} options={WEEKDAYS} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectField label="Session" id="session" value={form.session} onChange={(v) => set("session", v)} options={SESSIONS} />
            <SelectField label="Timeframe" id="timeframe" value={form.timeframe} onChange={(v) => set("timeframe", v)} options={TIMEFRAMES} />
            <SelectField
              label="Strategy / Playbook"
              id="playbook"
              value={form.playbook}
              onChange={(v) => set("playbook", v)}
              options={playbooks.length ? playbooks.map((p) => p.name) : STRATEGIES}
            />
          </div>
        </FormSection>

        <FormSection step={2} title="Market Context">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PillSelect label="Daily Bias" value={form.dailyBias} onChange={(v) => set("dailyBias", v)} options={["Bullish", "Bearish"]} tone="profit" />
            <PillSelect label="Direction" value={form.side} onChange={(v) => set("side", v)} options={["Long", "Short"]} tone="accent" />
            <PillSelect label="Market Condition" value={form.marketCondition} onChange={(v) => set("marketCondition", v)} options={["Balanced", "Imbalanced"]} tone="accent" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PillSelect label="H4 Candle" value={form.h4Candle} onChange={(v) => set("h4Candle", v)} options={H4_CANDLES} tone="amber" />
            <PillSelect label="Liquidity Purge" value={form.liquidityPurge} onChange={(v) => set("liquidityPurge", v)} options={["Yes", "No"]} tone="profit" />
            <PillSelect label="Entry Model" value={form.entryModel} onChange={(v) => set("entryModel", v)} options={ENTRY_MODELS} tone="accent" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PillSelect label="Entry Time" value={form.entryTime} onChange={(v) => set("entryTime", v)} options={ENTRY_TIMES} tone="profit" />
            <PillSelect label="Setup Quality" value={form.grade} onChange={(v) => set("grade", v)} options={SETUP_GRADES} tone="amber" />
          </div>
        </FormSection>

        <FormSection step={3} title="Entry & Risk">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Entry Price" id="entryPrice" type="number" step="any" value={form.entryPrice} onChange={(v) => set("entryPrice", v)} placeholder="1.08500" />
            <TextField label="Stop Loss" id="stopLoss" type="number" step="any" value={form.stopLoss} onChange={(v) => set("stopLoss", v)} placeholder="1.08200" />
            <TextField label="Take Profit" id="takeProfit" type="number" step="any" value={form.takeProfit} onChange={(v) => set("takeProfit", v)} placeholder="1.09400" />
            <Field label="Planned R:R" id="plannedRRDisplay">
              <output
                id="plannedRRDisplay"
                className="flex min-h-10 items-center justify-center rounded-lg border border-ring/30 bg-ring/5 px-3 font-mono text-sm font-bold text-ring"
              >
                {plannedRR !== null ? `1 : ${plannedRR.toFixed(2)}` : "Auto"}
              </output>
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Exit Price" id="exitPrice" type="number" step="any" value={form.exitPrice} onChange={(v) => set("exitPrice", v)} placeholder="1.09400" />
            <TextField label="Position Size (lots)" id="size" type="number" step="any" value={form.size} onChange={(v) => set("size", v)} placeholder="0.10" />
            <TextField label="Risk Amount ($ = 1R)" id="riskAmount" type="number" step="any" value={form.riskAmount} onChange={(v) => set("riskAmount", v)} placeholder="250" />
            <TextField label="Risk %" id="riskPct" type="number" step="any" value={form.riskPct} onChange={(v) => set("riskPct", v)} placeholder="1" />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField label="Duration (minutes)" id="durationMinutes" type="number" value={form.durationMinutes} onChange={(v) => set("durationMinutes", v)} placeholder="90" />
            <Field label="Realized R" id="realizedRDisplay">
              <output
                id="realizedRDisplay"
                className={cn(
                  "flex min-h-10 items-center justify-center rounded-lg border px-3 font-mono text-sm font-bold",
                  realizedR === null
                    ? "border-border bg-card text-muted-foreground"
                    : realizedR >= 0
                      ? "border-profit/30 bg-profit/5 text-profit"
                      : "border-loss/30 bg-loss/5 text-loss"
                )}
              >
                {realizedR !== null
                  ? `${realizedR >= 0 ? "+" : ""}${realizedR.toFixed(2)}R`
                  : "Auto"}
              </output>
            </Field>
            <Field label="P&L ($)" id="pnlDisplay">
              <output
                id="pnlDisplay"
                className={cn(
                  "flex min-h-10 items-center justify-center rounded-lg border px-3 font-mono text-sm font-bold",
                  pnl === null
                    ? "border-border bg-card text-muted-foreground"
                    : pnl >= 0
                      ? "border-profit/30 bg-profit/5 text-profit"
                      : "border-loss/30 bg-loss/5 text-loss"
                )}
              >
                {pnl !== null
                  ? `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`
                  : "Auto"}
              </output>
            </Field>
          </div>

          <div className="mt-4">
            <PillSelect label="Result" value={form.result} onChange={(v) => set("result", v)} options={["Win", "Loss", "Break Even"]} tone={form.result === "Loss" ? "loss" : form.result === "Break Even" ? "amber" : "profit"} />
          </div>
        </FormSection>

        <FormSection step={4} title="Confluence Tracking">
          <ChipMultiSelect
            label="Confluences"
            values={form.confluences}
            options={CONFLUENCES}
            onToggle={(c) =>
              set(
                "confluences",
                form.confluences.includes(c)
                  ? form.confluences.filter((x) => x !== c)
                  : [...form.confluences, c]
              )
            }
          />
          {form.confluences.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {form.confluences.length} confluence
              {form.confluences.length === 1 ? "" : "s"} selected
            </p>
          ) : null}
        </FormSection>

        <FormSection step={5} title="Psychology">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectField label="Emotion Before" id="emotionBefore" value={form.emotionBefore} onChange={(v) => set("emotionBefore", v)} options={EMOTIONS} />
            <SelectField label="Emotion During" id="emotionDuring" value={form.emotionDuring} onChange={(v) => set("emotionDuring", v)} options={EMOTIONS} />
            <SelectField label="Emotion After" id="emotionAfter" value={form.emotionAfter} onChange={(v) => set("emotionAfter", v)} options={EMOTIONS} />
          </div>
          <div className="mt-4">
            <Field label={`Confidence Level — ${form.confidence}/10`} id="confidenceRange">
              <input
                id="confidenceRange"
                type="range"
                min={1}
                max={10}
                value={form.confidence}
                onChange={(e) => set("confidence", Number(e.target.value))}
                className="w-full accent-[var(--color-ring)]"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection step={6} title="Screenshots">
          <ScreenshotUploader
            paths={shots}
            onChange={(slot, path) => setShots((s) => ({ ...s, [slot]: path }))}
          />
        </FormSection>

        <FormSection step={7} title="Trade Notes">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextareaField label="Entry Reason" id="entryReason" value={form.entryReason} onChange={(v) => set("entryReason", v)} placeholder="Why did you take this trade?" />
            <TextareaField label="Exit Reason" id="exitReason" value={form.exitReason} onChange={(v) => set("exitReason", v)} placeholder="Why did you exit here?" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextareaField label="Mistakes" id="mistakes" value={form.mistakes} onChange={(v) => set("mistakes", v)} placeholder="What could you have done better?" />
            <TextareaField label="Lessons" id="lessons" value={form.lessons} onChange={(v) => set("lessons", v)} placeholder="What will you remember?" />
          </div>
          <div className="mt-3">
            <TextareaField label="Additional Notes" id="notes" value={form.notes} onChange={(v) => set("notes", v)} placeholder="Any additional observations…" />
          </div>
        </FormSection>

        {state.error ? (
          <p role="alert" className="mb-4 rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-11 items-center justify-center rounded-lg bg-profit px-5 text-sm font-semibold text-profit-foreground hover:bg-profit/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : trade ? "Update trade" : "Log trade"}
          </button>
          <Link
            href="/trades"
            className="flex min-h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </Link>
        </div>
      </div>

      <aside className="flex flex-col gap-3 xl:sticky xl:top-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            A+ Checklist
          </h2>
          <ul className="space-y-1">
            {checklist.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between py-1.5 text-sm">
                <span className={ok ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 text-profit" aria-label="met" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" aria-label="not met" />
                )}
              </li>
            ))}
          </ul>
          <div
            className={cn(
              "mt-4 rounded-lg border p-4 text-center",
              isAplus ? "border-profit/30 bg-profit/10" : "border-border bg-secondary/40"
            )}
          >
            {isAplus ? (
              <Target className="mx-auto mb-1.5 h-5 w-5 text-profit" aria-hidden="true" />
            ) : (
              <Hourglass className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
            <p className={cn("text-xs font-bold", isAplus ? "text-profit" : "text-muted-foreground")}>
              {isAplus ? "A+ Confirmed" : "Building setup…"}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
