import type { AccountSettings, DailyPnl, Trade } from "@/lib/types";
import { getDailyPnl } from "@/lib/analytics";
import { sizedCorrectly } from "@/lib/model";
import { isKillZone } from "@/lib/types";

/*
 * Prop-account guardrails. On a funded account "how close am I to breaching"
 * matters more day to day than net P&L, so these are computed against the
 * limits in account settings and shown as distance-to-breach rather than as
 * raw numbers.
 */

export interface Guardrail {
  key: "daily" | "drawdown" | "target";
  label: string;
  /** How much of the limit is used, 0–1. Above 1 means breached. */
  used: number;
  usedLabel: string;
  limitLabel: string;
  breached: boolean;
  /** True for the profit target, where filling the bar is the good outcome. */
  positive: boolean;
}

export interface RiskReport {
  balance: number;
  peakBalance: number;
  todayPnl: number;
  lossesToday: number;
  guardrails: Guardrail[];
  /** Days where more losses were taken than the daily loss cap allows. */
  overtradedDays: { date: string; losses: number }[];
}

function fmt(n: number) {
  const rounded = Math.round(Math.abs(n));
  return `${n < 0 ? "-" : ""}$${rounded.toLocaleString("en-US")}`;
}

/** Running balance and its high-water mark, from the starting balance. */
function balanceSeries(daily: DailyPnl[], startingBalance: number) {
  let running = startingBalance;
  let peak = startingBalance;
  for (const d of daily) {
    running += d.pnl;
    if (running > peak) peak = running;
  }
  return { balance: running, peak };
}

export function getRiskReport(
  trades: Trade[],
  settings: AccountSettings,
  today: string
): RiskReport {
  const daily = getDailyPnl(trades);
  const { balance, peak } = balanceSeries(daily, settings.startingBalance);

  const todayEntry = daily.find((d) => d.date === today);
  const todayPnl = todayEntry?.pnl ?? 0;
  const lossesToday = todayEntry?.losses ?? 0;

  const guardrails: Guardrail[] = [];

  if (settings.dailyLossLimit) {
    // Only a losing day consumes the daily limit.
    const used = Math.max(0, -todayPnl);
    guardrails.push({
      key: "daily",
      label: "Daily loss limit",
      used: used / settings.dailyLossLimit,
      usedLabel: `${fmt(used)} used`,
      limitLabel: `of ${fmt(settings.dailyLossLimit)} today`,
      breached: used >= settings.dailyLossLimit,
      positive: false,
    });
  }

  if (settings.maxDrawdown) {
    const drawdown = Math.max(0, peak - balance);
    guardrails.push({
      key: "drawdown",
      label: "Max drawdown",
      used: drawdown / settings.maxDrawdown,
      usedLabel: `${fmt(drawdown)} below peak`,
      limitLabel: `of ${fmt(settings.maxDrawdown)} allowed`,
      breached: drawdown >= settings.maxDrawdown,
      positive: false,
    });
  }

  if (settings.profitTarget) {
    const gained = Math.max(0, balance - settings.startingBalance);
    guardrails.push({
      key: "target",
      label: "Profit target",
      used: gained / settings.profitTarget,
      usedLabel: `${fmt(gained)} made`,
      limitLabel: `of ${fmt(settings.profitTarget)} target`,
      breached: false,
      positive: true,
    });
  }

  const overtradedDays = daily
    .filter((d) => d.losses > settings.maxLossesPerDay)
    .map((d) => ({ date: d.date, losses: d.losses }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    balance,
    peakBalance: peak,
    todayPnl,
    lossesToday,
    guardrails,
    overtradedDays,
  };
}

/*
 * Discipline: not whether the trades won, but whether they followed the
 * model. Each rate reports only over the trades that actually recorded the
 * relevant answer, and says how many that was — a 100% rate over three
 * trades is not the same claim as 100% over sixty.
 */

export interface DisciplineRate {
  key: string;
  label: string;
  /** Percentage, or null when no trade has recorded this yet. */
  rate: number | null;
  recorded: number;
  detail: string;
}

export function getDisciplineRates(
  trades: Trade[],
  settings: AccountSettings
): DisciplineRate[] {
  const rate = (
    key: string,
    label: string,
    detail: string,
    answers: (boolean | null)[]
  ): DisciplineRate => {
    const recorded = answers.filter((a) => a !== null) as boolean[];
    return {
      key,
      label,
      detail,
      recorded: recorded.length,
      rate: recorded.length
        ? Math.round((recorded.filter(Boolean).length / recorded.length) * 1000) / 10
        : null,
    };
  };

  return [
    rate(
      "killzone",
      "Entered in a kill zone",
      "1 / 5 / 9 AM New York only.",
      trades.map((t) => (t.entryTime ? isKillZone(t.entryTime) : null))
    ),
    rate(
      "retest",
      "Waited for the OB retest",
      "Rather than entering at the engulfing candle.",
      trades.map((t) => (t.entryExecution ? t.entryExecution === "OB retest" : null))
    ),
    rate(
      "sizing",
      "Sized to the model",
      `${settings.riskPctAligned}% when Daily-aligned, ${settings.riskPctUnaligned}% otherwise.`,
      trades.map((t) => sizedCorrectly(t, settings))
    ),
    rate(
      "smt",
      "SMT was clear, not forced",
      "Counted over trades where SMT was recorded at all.",
      trades.map((t) => (t.smtQuality ? t.smtQuality !== "Forced" : null))
    ),
    rate(
      "sweep",
      "Liquidity sweep was clean",
      "A borderline sweep is not a confirmed one.",
      trades.map((t) => (t.sweepQuality ? t.sweepQuality === "Clean" : null))
    ),
  ];
}
