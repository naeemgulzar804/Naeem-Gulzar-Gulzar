import type { Stats, Trade } from "@/lib/types";
import { getEquityCurve, getStats } from "@/lib/analytics";

/*
 * A composite 0-100 read on account health, plus the six axes it is made of.
 *
 * The point of the radar is not the single number — it is the shape. Two
 * accounts can both score 70 while failing in opposite ways: one wins often
 * and gives it all back on a single bad day, the other grinds a low win rate
 * into a smooth curve. The axes are what tell those apart, so each one is
 * normalised against a target a funded account is actually held to rather
 * than against the trader's own history (grading on a curve hides decay).
 */

export interface ScoreAxis {
  /** Short label for the radar vertex. */
  label: string;
  /** Normalised 0-100. */
  value: number;
  /** The underlying figure, already formatted for display. */
  raw: string;
}

export interface TradingScore {
  /** Weighted composite, 0-100. */
  score: number;
  axes: ScoreAxis[];
  maxDrawdown: number;
  maxDrawdownPct: number;
  recoveryFactor: number;
  /** Largest winning day as a share of gross profit, 0-1. */
  concentration: number;
}

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** Maps a raw figure onto 0-100, where `floor` scores 0 and `ceiling` scores 100. */
function scale(value: number, floor: number, ceiling: number) {
  return clamp(((value - floor) / (ceiling - floor)) * 100);
}

/**
 * Peak-to-trough decline on the daily equity curve. Measured on closed-day
 * balances, so it is the drawdown the account statement would show, not the
 * deeper intraday one.
 */
export function getMaxDrawdown(
  curve: { balance: number }[],
  startingBalance: number
) {
  let peak = startingBalance;
  let maxDd = 0;
  for (const point of curve) {
    if (point.balance > peak) peak = point.balance;
    const dd = peak - point.balance;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

export function getTradingScore(
  trades: Trade[],
  startingBalance: number,
  precomputed?: Stats
): TradingScore {
  const stats = precomputed ?? getStats(trades);
  const curve = getEquityCurve(trades, startingBalance);

  const maxDrawdown = getMaxDrawdown(curve, startingBalance);
  const maxDrawdownPct =
    startingBalance > 0 ? (maxDrawdown / startingBalance) * 100 : 0;

  /* Net profit per unit of pain. Undefined without a drawdown, which is a
     good problem — treat it as top of scale rather than dividing by zero. */
  const recoveryFactor =
    maxDrawdown > 0 ? stats.netPnl / maxDrawdown : stats.netPnl > 0 ? 5 : 0;

  /* Prop-firm consistency: how much of the profit came from one lucky day.
     A single day carrying the account is the failure mode this catches. */
  const winningDays = curve.filter((d) => d.pnl > 0);
  const grossDayProfit = winningDays.reduce((s, d) => s + d.pnl, 0);
  const bestDayPnl = winningDays.reduce((m, d) => Math.max(m, d.pnl), 0);
  const concentration =
    grossDayProfit > 0 ? bestDayPnl / grossDayProfit : 0;

  const winLossRatio =
    stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : stats.avgWin > 0 ? 3 : 0;

  const axes: ScoreAxis[] = [
    {
      label: "Win %",
      value: scale(stats.winRate, 0, 60),
      raw: `${stats.winRate.toFixed(1)}%`,
    },
    {
      label: "Profit factor",
      value: scale(stats.profitFactor, 1, 3),
      raw: stats.profitFactor.toFixed(2),
    },
    {
      label: "Avg win/loss",
      value: scale(winLossRatio, 0.5, 3),
      raw: winLossRatio.toFixed(2),
    },
    {
      label: "Recovery factor",
      value: scale(recoveryFactor, 0, 5),
      raw: recoveryFactor.toFixed(2),
    },
    {
      // Inverted: a small drawdown is a high score.
      label: "Max drawdown",
      value: scale(maxDrawdownPct, 25, 0),
      raw: `${maxDrawdownPct.toFixed(1)}%`,
    },
    {
      // 20% or less of profit from the best day is full marks.
      label: "Consistency",
      value: scale(concentration, 1, 0.2),
      raw: `${(concentration * 100).toFixed(0)}%`,
    },
  ];

  /* Weighted rather than flat: profit factor and drawdown decide whether an
     account survives; win rate on its own decides very little. */
  const weights = [0.12, 0.24, 0.16, 0.16, 0.2, 0.12];
  const score = axes.reduce((sum, axis, i) => sum + axis.value * weights[i], 0);

  return {
    score: Math.round(score * 100) / 100,
    axes,
    maxDrawdown,
    maxDrawdownPct,
    recoveryFactor,
    concentration,
  };
}
