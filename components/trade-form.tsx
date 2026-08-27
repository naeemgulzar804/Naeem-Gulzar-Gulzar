"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Hourglass,
  Target,
  XCircle,
} from "lucide-react";
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
import type { AccountSettings, Playbook, Trade } from "@/lib/types";
import {
  CONFLUENCES,
  EMOTIONS,
  ENTRY_EXECUTIONS,
  ENTRY_MODELS,
  ENTRY_TIMES,
  H4_CANDLES,
  isKillZone,
  PAIRS,
  SESSIONS,
  SMT_PAIRS,
  SMT_QUALITIES,
  STRATEGIES,
  SWEEP_QUALITIES,
  TIMEFRAMES,
  WEEKDAYS,
} from "@/lib/types";
import {
  allowedRiskPct,
  criteriaStates,
  derivedGrade,
  gradeVerdict,
} from "@/lib/model";
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
  dailyAligned: string;
  smtQuality: string;
  smtPair: string;
  sweepQuality: string;
  entryExecution: string;
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
      dailyAligned: "",
      smtQuality: "",
      smtPair: "",
      sweepQuality: "",
      entryExecution: "",
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
    dailyAligned:
      trade.dailyAligned === null ? "" : trade.dailyAligned ? "Yes" : "No",
    smtQuality: trade.smtQuality,
    smtPair: trade.smtPair,
    sweepQuality: trade.sweepQuality,
    entryExecution: trade.entryExecution,
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
  settings,
}: {
  playbooks: Playbook[];
  trade?: Trade;
  settings: AccountSettings;
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

  /*
   * The model's three criteria, and the grade they imply. Grade is derived,
   * never chosen: the previous checklist listed "Quality = A+" as one of the
   * things that made a setup A+, which graded nothing.
   */
  const criteria = {
    dailyAligned:
      form.dailyAligned === "Yes"
        ? true
        : form.dailyAligned === "No"
          ? false
          : null,
    smtQuality: form.smtQuality,
    sweepQuality: form.sweepQuality,
  };
  const states = criteriaStates(criteria);
  const grade = derivedGrade(criteria);
  const verdict = gradeVerdict(grade);

  // A legacy trade with no criteria recorded keeps the grade it was saved
  // with, rather than being silently downgraded on a routine edit.
  const postedGrade = grade ?? trade?.grade ?? "B";

  const inKillZone = form.entryTime ? isKillZone(form.entryTime) : null;
  const onRetest = form.entryExecution ? form.entryExecution === "OB retest" : null;

  // Risk sizing against what the model allows for this grade.
  const allowedRisk = allowedRiskPct(criteria, settings);
  const enteredRisk = parseFloat(form.riskPct);
  const overRisked =
    allowedRisk !== null &&
    Number.isFinite(enteredRisk) &&
    enteredRisk > allowedRisk + 0.05;

  const discipline: { label: string; met: boolean | null }[] = [
    { label: "Entry in a kill zone (1/5/9 AM NY)", met: inKillZone },
    { label: "Entered on the OB retest", met: onRetest },
    {
      label:
        allowedRisk === null
          ? "Risk sized to the model"
          : `Risk sized to the model (${allowedRisk}%)`,
      met: allowedRisk === null || !Number.isFinite(enteredRisk) ? null : !overRisked,
    },
    { label: "Result recorded", met: form.result ? true : null },
  ];

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px] xl:items-start">
      {/* Values the server action reads. Kept as hidden inputs so the whole
          form posts as one payload without lifting every control into RSC. */}
      {trade ? <input type="hidden" name="id" value={trade.id} /> : null}
      {Object.entries({
        ...form,
        grade: postedGrade,
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
          {/* The old yes/no "Liquidity Purge" control lived here. The A+
              criteria section now asks the same question with the grading the
              model actually uses, and asking twice in different words is how a
              journal ends up disagreeing with itself. The stored value is kept
              for trades logged before that change. */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PillSelect label="H4 Candle" value={form.h4Candle} onChange={(v) => set("h4Candle", v)} options={H4_CANDLES} tone="amber" />
            <PillSelect label="Entry Model" value={form.entryModel} onChange={(v) => set("entryModel", v)} options={ENTRY_MODELS} tone="accent" />
          </div>
          <div className="mt-4">
            <PillSelect
              label="Entry Time (NY kill zone)"
              value={form.entryTime}
              onChange={(v) => set("entryTime", v)}
              options={ENTRY_TIMES}
              tone="profit"
            />
            {form.entryTime && !isKillZone(form.entryTime) ? (
              <p className="mt-2 text-xs text-loss">
                {form.entryTime} is outside the model&rsquo;s kill zones. Kept
                as logged, but it will not count as a kill-zone entry.
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection step={3} title="A+ Criteria">
          <p className="mb-4 text-xs text-muted-foreground">
            All three present is an A+ setup at full risk. Two is B-grade at
            half risk. One or none, the model says stand down. The grade is
            worked out from these answers — you don&rsquo;t set it yourself.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PillSelect
              label="1. Daily bias aligns with H4 direction"
              value={form.dailyAligned}
              onChange={(v) => set("dailyAligned", v)}
              options={["Yes", "No"]}
              tone="profit"
            />
            <PillSelect
              label="3. H4 liquidity sweep"
              value={form.sweepQuality}
              onChange={(v) => set("sweepQuality", v)}
              options={SWEEP_QUALITIES}
              tone="amber"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PillSelect
              label="2. SMT divergence"
              value={form.smtQuality}
              onChange={(v) => set("smtQuality", v)}
              options={SMT_QUALITIES}
              tone="accent"
            />
            <PillSelect
              label="SMT confirmed on"
              value={form.smtPair}
              onChange={(v) => set("smtPair", v)}
              options={SMT_PAIRS}
              tone="accent"
            />
          </div>
          {form.smtQuality === "Forced" ? (
            <p className="mt-3 rounded-xl bg-loss/10 px-3 py-2 text-xs text-loss">
              Logging this honestly is the whole point — forced SMT is the
              easiest criterion to talk yourself into after the fact.
            </p>
          ) : null}

          <div className="mt-4">
            <PillSelect
              label="How the entry was executed"
              value={form.entryExecution}
              onChange={(v) => set("entryExecution", v)}
              options={ENTRY_EXECUTIONS}
              tone="accent"
            />
            {form.entryExecution === "Early — engulfing candle" ? (
              <p className="mt-2 text-xs text-loss">
                Entered at the engulfing candle rather than waiting for price to
                return to the 15M orderblock.
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection step={4} title="Entry & Risk">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Entry Price" id="entryPrice" type="number" step="any" value={form.entryPrice} onChange={(v) => set("entryPrice", v)} placeholder="1.08500" />
            <TextField label="Stop Loss" id="stopLoss" type="number" step="any" value={form.stopLoss} onChange={(v) => set("stopLoss", v)} placeholder="1.08200" />
            <TextField label="Take Profit" id="takeProfit" type="number" step="any" value={form.takeProfit} onChange={(v) => set("takeProfit", v)} placeholder="1.09400" />
            <Field label="Planned R:R" id="plannedRRDisplay">
              <output
                id="plannedRRDisplay"
                className="flex min-h-10 items-center justify-center rounded-lg border border-accent-border/30 bg-ring/5 px-3 tabular text-sm font-bold text-accent"
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
                  "flex min-h-10 items-center justify-center rounded-lg border px-3 tabular text-sm font-bold",
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
                  "flex min-h-10 items-center justify-center rounded-lg border px-3 tabular text-sm font-bold",
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

        <FormSection step={5} title="Confluence Tracking">
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

        <FormSection step={6} title="Psychology">
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

        <FormSection step={7} title="Screenshots">
          <ScreenshotUploader
            paths={shots}
            onChange={(slot, path) => setShots((s) => ({ ...s, [slot]: path }))}
          />
        </FormSection>

        <FormSection step={8} title="Trade Notes">
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
            className="flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            A+ Criteria
          </h2>
          <ul className="space-y-1">
            {states.map((c) => (
              <li key={c.key} className="flex items-start justify-between gap-3 py-1.5">
                <span className="min-w-0 text-sm">
                  <span
                    className={
                      c.met === true ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-faint">
                    {c.detail}
                  </span>
                </span>
                <CriterionIcon met={c.met} />
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "mt-4 rounded-xl border p-4 text-center",
              grade === "A+"
                ? "border-profit/30 bg-profit/10"
                : grade === "B"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : grade === "C"
                    ? "border-loss/30 bg-loss/10"
                    : "border-border bg-secondary/40"
            )}
          >
            {grade === "A+" ? (
              <Target className="mx-auto mb-1.5 h-5 w-5 text-profit" aria-hidden="true" />
            ) : grade === "C" ? (
              <XCircle className="mx-auto mb-1.5 h-5 w-5 text-loss" aria-hidden="true" />
            ) : grade === null ? (
              <Hourglass className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mx-auto mb-1.5 h-5 w-5 text-amber-500" aria-hidden="true" />
            )}
            <p
              className={cn(
                "text-xs font-bold",
                grade === "A+"
                  ? "text-profit"
                  : grade === "C"
                    ? "text-loss"
                    : grade === "B"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
              )}
            >
              {verdict.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{verdict.detail}</p>
          </div>

          {overRisked ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss"
            >
              Risking {enteredRisk}% on a setup the model caps at {allowedRisk}%.
              Keeping full risk on a setup that didn&rsquo;t earn it is the
              mistake that costs the most.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Execution
          </h2>
          <ul className="space-y-1">
            {discipline.map((d) => (
              <li key={d.label} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className={d.met === true ? "text-foreground" : "text-muted-foreground"}>
                  {d.label}
                </span>
                <CriterionIcon met={d.met} />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </form>
  );
}

/** Met, not met, or not answered — three states, not two. */
function CriterionIcon({ met }: { met: boolean | null }) {
  if (met === true) {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-profit" aria-label="met" />;
  }
  if (met === false) {
    return <XCircle className="h-4 w-4 shrink-0 text-loss" aria-label="not met" />;
  }
  return (
    <Circle className="h-4 w-4 shrink-0 text-faint/50" aria-label="not answered" />
  );
}
