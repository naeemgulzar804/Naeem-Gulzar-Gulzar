import type { Account, PropEvent, Trade } from "@/lib/types";
import {
  CUT_PLAYBOOK,
  FRAMEWORK,
  PHASE_LABEL,
  TIER_BY_PHASE,
  TIER_META,
  UPGRADE_LADDER,
  reinvestStageFor,
  type LadderRung,
  type PropPhase,
  type ReinvestStage,
  type Tier,
} from "@/lib/prop-framework";

/*
 * The framework's rules, applied to real accounts.
 *
 * Everything here is a pure function of the accounts, the payout/cut ledger,
 * and the logged trades — no fetching, no dates read from the clock. `today`
 * is always passed in, so the same inputs always produce the same guidance and
 * the whole engine is testable from a plain object.
 *
 * The design principle throughout: never report a raw number where the
 * framework asks a question. "You are $1,240 from the cut trigger" is the
 * answer; "balance $48,760" is not.
 */

// ---------------------------------------------------------------------------
// Dates. Plain ISO days, compared in UTC so a timezone never shifts a cycle.
// ---------------------------------------------------------------------------

function utcOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(from: string, to: string) {
  return Math.round((utcOf(to) - utcOf(from)) / 86_400_000);
}

export function addDays(iso: string, days: number) {
  return new Date(utcOf(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Actions — the output the whole page is built around.
// ---------------------------------------------------------------------------

export type ActionTone = "critical" | "warn" | "good" | "info";

export interface Action {
  tone: ActionTone;
  title: string;
  detail: string;
  /** The rule this came from, so every instruction is traceable. */
  rule: string;
  /** Set when the action concerns one account. */
  accountId?: string;
}

const TONE_RANK: Record<ActionTone, number> = {
  critical: 0,
  good: 1,
  warn: 2,
  info: 3,
};

function byUrgency(a: Action, b: Action) {
  return TONE_RANK[a.tone] - TONE_RANK[b.tone];
}

// ---------------------------------------------------------------------------
// Balances derived from the journal.
// ---------------------------------------------------------------------------

const isWin = (t: Trade) => t.result === "Win";
const isLoss = (t: Trade) => t.result === "Loss";
const isClosed = (t: Trade) => isWin(t) || isLoss(t);

export interface AccountEquity {
  /** Net P&L of every trade logged against the account. */
  pnl: number;
  /** Highest the running balance ever reached, for trailing drawdown. */
  peak: number;
  trades: number;
}

/**
 * Per-account equity, walked in date order so the high-water mark is real
 * rather than just max(start, end). Accounts with no logged trades are absent
 * from the map and fall back to their starting balance.
 */
export function getAccountEquity(
  accounts: Account[],
  trades: Trade[]
): Map<string, AccountEquity> {
  const out = new Map<string, AccountEquity>();
  const byDate = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  for (const account of accounts) {
    const own = byDate.filter((t) => t.accountId === account.id);
    let running = account.startingBalance;
    let peak = account.startingBalance;
    for (const t of own) {
      running += t.pnl;
      if (running > peak) peak = running;
    }
    out.set(account.id, {
      pnl: running - account.startingBalance,
      peak,
      trades: own.length,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The 4-on / 1-off cycle.
// ---------------------------------------------------------------------------

export interface CycleState {
  /** 0–4 within the five-week cycle. */
  weekIndex: number;
  onWeek: boolean;
  daysUntilSwitch: number;
  switchesOn: string;
  label: string;
  /** True before the anchor date — the account has not started cycling yet. */
  pending: boolean;
}

const CYCLE_DAYS = (FRAMEWORK.cycleOnWeeks + FRAMEWORK.cycleOffWeeks) * 7;
const ON_DAYS = FRAMEWORK.cycleOnWeeks * 7;

export function cycleState(cycleStart: string, today: string): CycleState {
  const elapsed = daysBetween(cycleStart, today);

  if (elapsed < 0) {
    return {
      weekIndex: 0,
      onWeek: false,
      daysUntilSwitch: -elapsed,
      switchesOn: cycleStart,
      label: `Starts in ${-elapsed} ${-elapsed === 1 ? "day" : "days"}`,
      pending: true,
    };
  }

  const dayInCycle = elapsed % CYCLE_DAYS;
  const weekIndex = Math.floor(dayInCycle / 7);
  const onWeek = dayInCycle < ON_DAYS;
  const daysUntilSwitch = (onWeek ? ON_DAYS : CYCLE_DAYS) - dayInCycle;

  return {
    weekIndex,
    onWeek,
    daysUntilSwitch,
    switchesOn: addDays(today, daysUntilSwitch),
    label: onWeek
      ? `Week ${weekIndex + 1} of ${FRAMEWORK.cycleOnWeeks} — trading`
      : "Rest week — do not trade",
    pending: false,
  };
}

// ---------------------------------------------------------------------------
// Rapid-pass position sizing.
// ---------------------------------------------------------------------------

export interface SizingInput {
  accountSize: number;
  currentBalance: number;
  tier: Tier;
  /** Phase 1 evaluations are usually 10%, Phase 2 usually 5%. */
  profitTargetPct: number;
  /** How many 1:3 winners you plan to pass in. The guide says 1 to 3. */
  winsToPass: number;
  riskReward: number;
  /** Optional, for a lot size rather than a dollar figure. */
  stopPips?: number | null;
  pipValuePerLot?: number;
}

export interface SizingPlan {
  cutBalance: number;
  /** Dollars left before the cut trigger fires. */
  buffer: number;
  targetBalance: number;
  remainingProfit: number;
  /** What the target alone would ask you to risk. */
  riskFromTarget: number;
  /** What the remaining drawdown buffer allows. */
  riskCeiling: number;
  riskPerTrade: number;
  riskPct: number;
  rewardPerTrade: number;
  boundBy: "target" | "buffer" | "hard cap";
  attemptsLeft: number;
  lots: number | null;
  warnings: string[];
}

/** Never risk more than this much of the balance on one evaluation trade. */
const HARD_RISK_CAP_PCT = 2;
/** Always leave room for at least this many more losses inside the buffer. */
const MIN_ATTEMPTS_IN_BUFFER = 2;

/**
 * The rapid-pass sizing formula.
 *
 * The guide states the shape of the rule but not the arithmetic: minimum 1:3,
 * size from balance and remaining drawdown, and increase slightly after each
 * loss to account for accumulated drawdown. This is that rule written out.
 *
 * Risk is whatever a plan of `winsToPass` winners at `riskReward` needs in
 * order to reach the profit target from where the account actually is. After a
 * loss the account sits further from the target, so the same formula asks for
 * a slightly larger position — the increase falls out of the maths rather than
 * being a separate martingale step. Two ceilings then apply: half the
 * remaining drawdown buffer, so a losing streak can never reach the cut
 * trigger in a single trade, and a hard 2% of balance. When a ceiling binds,
 * the plan says so — that is the signal the account is better cut and rebought
 * than fought uphill.
 */
export function planSizing(input: SizingInput): SizingPlan {
  const {
    accountSize,
    currentBalance,
    tier,
    profitTargetPct,
    winsToPass,
    riskReward,
    stopPips,
    pipValuePerLot = 10,
  } = input;

  const cutPct = FRAMEWORK.cutTriggerPct[tier];
  const cutBalance = accountSize * (1 - cutPct / 100);
  const buffer = Math.max(0, currentBalance - cutBalance);

  const targetBalance = accountSize * (1 + profitTargetPct / 100);
  const remainingProfit = Math.max(0, targetBalance - currentBalance);

  const wins = Math.max(1, winsToPass);
  const rr = Math.max(1, riskReward);

  const riskFromTarget = remainingProfit / (rr * wins);
  const riskCeiling = buffer / MIN_ATTEMPTS_IN_BUFFER;
  const hardCap = (currentBalance * HARD_RISK_CAP_PCT) / 100;

  const riskPerTrade = Math.max(0, Math.min(riskFromTarget, riskCeiling, hardCap));
  const boundBy: SizingPlan["boundBy"] =
    riskPerTrade === riskCeiling && riskCeiling < riskFromTarget
      ? "buffer"
      : riskPerTrade === hardCap && hardCap < riskFromTarget
        ? "hard cap"
        : "target";

  const warnings: string[] = [];
  if (buffer <= 0 || riskPerTrade < 1) {
    warnings.push(
      `This account is already at or past the −${cutPct}% cut trigger. The framework says cut and rebuy, not resize.`
    );
  } else if (boundBy === "buffer") {
    warnings.push(
      `The target no longer fits inside the remaining drawdown. Sizing has been capped at half the buffer — if the next two trades lose, cut and rebuy.`
    );
  } else if (boundBy === "hard cap") {
    warnings.push(
      `Capped at ${HARD_RISK_CAP_PCT}% of balance. Passing in ${wins} ${wins === 1 ? "win" : "wins"} would need more risk than that; plan for more winners instead.`
    );
  }
  if (rr < FRAMEWORK.minRiskReward) {
    warnings.push(
      `Below the framework's minimum ${FRAMEWORK.minRiskReward}:1 — no 1:1 or 1:2 trades.`
    );
  }

  return {
    cutBalance,
    buffer,
    targetBalance,
    remainingProfit,
    riskFromTarget,
    riskCeiling,
    riskPerTrade,
    riskPct: currentBalance > 0 ? (riskPerTrade / currentBalance) * 100 : 0,
    rewardPerTrade: riskPerTrade * rr,
    boundBy,
    attemptsLeft: riskPerTrade > 0 ? Math.floor(buffer / riskPerTrade) : 0,
    lots:
      stopPips && stopPips > 0 && pipValuePerLot > 0
        ? riskPerTrade / (stopPips * pipValuePerLot)
        : null,
    warnings,
  };
}

/** The profit target a phase is usually asked to hit. */
export function defaultTargetPct(phase: PropPhase) {
  return phase === "phase1" ? 10 : phase === "phase2" ? 5 : 3;
}

// ---------------------------------------------------------------------------
// Per-account guidance.
// ---------------------------------------------------------------------------

export type AccountStatus =
  | "cut-now"
  | "payout-ready"
  | "danger"
  | "watch"
  | "resting"
  | "healthy";

export interface AccountGuidance {
  account: Account;
  tier: Tier;
  phaseLabel: string;
  size: number;
  balance: number;
  /** True when the balance came from logged trades rather than an override. */
  derived: boolean;
  loggedTrades: number;
  pnl: number;
  pnlPct: number;
  peak: number;
  drawdown: number;
  drawdownPct: number;
  cutPct: number;
  cutBalance: number;
  roomToCut: number;
  /** How much of the allowed drawdown is spent, 0–1. */
  cutProgress: number;
  payoutBalance: number | null;
  roomToPayout: number | null;
  payoutProgress: number | null;
  status: AccountStatus;
  cycle: CycleState | null;
  actions: Action[];
}

function statusOf(
  tier: Tier,
  cutProgress: number,
  payoutProgress: number | null,
  cycle: CycleState | null
): AccountStatus {
  if (cutProgress >= 1) return "cut-now";
  if (payoutProgress !== null && payoutProgress >= 1) return "payout-ready";
  if (cutProgress >= 2 / 3) return "danger";
  if (cycle && !cycle.onWeek && !cycle.pending) return "resting";
  if (cutProgress >= 1 / 3) return "watch";
  return "healthy";
}

export function guideAccount(
  account: Account,
  equity: AccountEquity | undefined,
  today: string
): AccountGuidance {
  const tier = TIER_BY_PHASE[account.phase];
  const size = account.startingBalance;
  const derived = account.currentBalance === null;
  const balance = derived
    ? size + (equity?.pnl ?? 0)
    : (account.currentBalance as number);
  const peak = Math.max(derived ? (equity?.peak ?? size) : size, balance);

  const pnl = balance - size;
  const pnlPct = size > 0 ? (pnl / size) * 100 : 0;

  const cutPct = FRAMEWORK.cutTriggerPct[tier];
  const basis = account.drawdownBasis === "peak" ? peak : size;
  const cutBalance = basis * (1 - cutPct / 100);
  const drawdown = Math.max(0, basis - balance);
  const drawdownPct = basis > 0 ? (drawdown / basis) * 100 : 0;
  const roomToCut = balance - cutBalance;
  const cutProgress = cutPct > 0 ? drawdownPct / cutPct : 0;

  const payoutBalance = tier === 1 ? size * (1 + FRAMEWORK.payoutTriggerPct / 100) : null;
  const roomToPayout = payoutBalance === null ? null : payoutBalance - balance;
  const payoutProgress =
    payoutBalance === null ? null : pnl / (size * (FRAMEWORK.payoutTriggerPct / 100));

  const cycle =
    tier === 1 && account.cycleStart ? cycleState(account.cycleStart, today) : null;

  const status = statusOf(tier, cutProgress, payoutProgress, cycle);
  const actions: Action[] = [];
  const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
  const name = account.name || account.firm || "This account";

  if (status === "cut-now") {
    actions.push({
      tone: "critical",
      title: `Cut ${name} — it is at −${drawdownPct.toFixed(1)}%`,
      detail: CUT_PLAYBOOK[tier],
      rule: `Tier ${tier} cut trigger: −${cutPct}%`,
      accountId: account.id,
    });
  } else if (status === "payout-ready") {
    actions.push({
      tone: "good",
      title: `Request the payout on ${name} now`,
      detail: `It is up ${pnlPct.toFixed(1)}% (${money(pnl)}). Lock at exactly +${FRAMEWORK.payoutTriggerPct}% — do not wait for 5% or 10%.`,
      rule: "Tier 1: lock payout at +3%",
      accountId: account.id,
    });
  } else if (status === "danger") {
    actions.push({
      tone: "warn",
      title: `${name} is ${money(roomToCut)} from its cut trigger`,
      detail: `${drawdownPct.toFixed(1)}% of the allowed ${cutPct}% is gone. Size down or stand aside; do not try to trade it back.`,
      rule: `Tier ${tier} cut trigger: −${cutPct}%`,
      accountId: account.id,
    });
  }

  if (cycle && !cycle.onWeek && !cycle.pending && status !== "cut-now") {
    actions.push({
      tone: "info",
      title: `${name} is in its rest week`,
      detail: `Do not trade it until ${cycle.switchesOn} (${cycle.daysUntilSwitch} ${cycle.daysUntilSwitch === 1 ? "day" : "days"}).`,
      rule: "Tier 1: 4 weeks on / 1 week off",
      accountId: account.id,
    });
  }

  if (tier === 1 && !account.cycleStart) {
    actions.push({
      tone: "warn",
      title: `Set a cycle start date for ${name}`,
      detail:
        "Without an anchor date this account cannot be staggered, and staggering is the single most important operational rule in the system.",
      rule: "Tier 1: stagger all account start dates",
      accountId: account.id,
    });
  }

  if (tier !== 1 && status !== "cut-now") {
    const plan = planSizing({
      accountSize: size,
      currentBalance: balance,
      tier,
      profitTargetPct: defaultTargetPct(account.phase),
      winsToPass: 2,
      riskReward: FRAMEWORK.minRiskReward,
    });
    actions.push({
      tone: "info",
      title: `Risk ${money(plan.riskPerTrade)} per trade on ${name}`,
      detail: `${plan.riskPct.toFixed(2)}% of balance, targeting ${money(plan.rewardPerTrade)} at ${FRAMEWORK.minRiskReward}:1. ${plan.warnings[0] ?? `Two winners at this size clear the ${defaultTargetPct(account.phase)}% target.`}`,
      rule: "Rapid evaluation pass: calculated position sizing",
      accountId: account.id,
    });
  }

  return {
    account,
    tier,
    phaseLabel: PHASE_LABEL[account.phase],
    size,
    balance,
    derived,
    loggedTrades: equity?.trades ?? 0,
    pnl,
    pnlPct,
    peak,
    drawdown,
    drawdownPct,
    cutPct,
    cutBalance,
    roomToCut,
    cutProgress,
    payoutBalance,
    roomToPayout,
    payoutProgress,
    status,
    cycle,
    actions,
  };
}

// ---------------------------------------------------------------------------
// The payout / cut ledger, read as the framework asks its questions.
// ---------------------------------------------------------------------------

export interface LedgerSummary {
  lifetimePayouts: number;
  payoutTotal: number;
  /** Payouts since the most recent cut — the "3 consecutive payouts" gate. */
  payoutStreak: number;
  lastPayout: PropEvent | null;
  lastCut: PropEvent | null;
  daysSinceLastCut: number | null;
  cutsInWindow: number;
  spentOnEvaluations: number;
}

export function summariseLedger(
  events: PropEvent[],
  today: string
): LedgerSummary {
  const sorted = [...events].sort((a, b) =>
    b.occurredOn === a.occurredOn
      ? b.id.localeCompare(a.id)
      : b.occurredOn.localeCompare(a.occurredOn)
  );

  const payouts = sorted.filter((e) => e.kind === "payout");
  const cuts = sorted.filter((e) => e.kind === "cut");
  const lastCut = cuts[0] ?? null;

  // Newest first: count payouts until a cut interrupts the run.
  let payoutStreak = 0;
  for (const e of sorted) {
    if (e.kind === "payout") payoutStreak += 1;
    else if (e.kind === "cut") break;
  }

  return {
    lifetimePayouts: payouts.length,
    payoutTotal: payouts.reduce((s, e) => s + e.amount, 0),
    payoutStreak,
    lastPayout: payouts[0] ?? null,
    lastCut,
    daysSinceLastCut: lastCut ? daysBetween(lastCut.occurredOn, today) : null,
    cutsInWindow: cuts.filter(
      (e) => daysBetween(e.occurredOn, today) <= FRAMEWORK.noCutWindowDays
    ).length,
    spentOnEvaluations: sorted
      .filter((e) => e.kind === "purchase")
      .reduce((s, e) => s + e.amount, 0),
  };
}

// ---------------------------------------------------------------------------
// Portfolio-level guidance.
// ---------------------------------------------------------------------------

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

export interface TierSummary {
  tier: Tier;
  capital: number;
  accounts: number;
  /** What the framework requires this tier to hold, given T1. */
  required: number | null;
  gap: number;
  /** Share of deployed capital, 0–1. */
  share: number;
}

export interface LadderStatus extends LadderRung {
  unlocked: boolean;
  blockers: string[];
  /** True for the largest size currently unlocked. */
  current: boolean;
}

export interface SizeConcentration {
  size: number;
  capital: number;
  share: number;
  ok: boolean;
}

export interface PropReport {
  accounts: AccountGuidance[];
  tiers: TierSummary[];
  t1: number;
  t2: number;
  t3: number;
  deployed: number;
  requiredT2: number;
  requiredT3: number;
  ratioOk: boolean;
  stage: ReinvestStage;
  personalIncomeUnlocked: boolean;
  nextSpend: { step: string; detail: string; amount: number | null };
  ledger: LedgerSummary;
  winRate: { rate: number | null; sample: number };
  scaleUp: Check[];
  scaleUpReady: boolean;
  ladder: LadderStatus[];
  unlockedSize: number;
  concentration: SizeConcentration[];
  /** Groups of T1 accounts that share a cycle start date — not staggered. */
  staggerCollisions: { date: string; accounts: string[] }[];
  progress: { t1: number; t2: number; t3: number };
  actions: Action[];
}

function sumBy(list: AccountGuidance[], tier: Tier) {
  return list
    .filter((a) => a.tier === tier)
    .reduce((s, a) => s + a.size, 0);
}

/**
 * The whole framework, applied.
 *
 * Tier capital is counted at account size, not at current balance: the ratio
 * rule is about how much funding sits in each layer, and a T1 account that is
 * down 2% this week is still $100K of funding.
 */
export function getPropReport(
  accounts: Account[],
  events: PropEvent[],
  trades: Trade[],
  today: string
): PropReport {
  const tracked = accounts.filter((a) => a.inFramework);
  const equity = getAccountEquity(tracked, trades);
  const guided = tracked
    .map((a) => guideAccount(a, equity.get(a.id), today))
    .sort((a, b) => a.tier - b.tier || b.size - a.size);

  const t1 = sumBy(guided, 1);
  const t2 = sumBy(guided, 2);
  const t3 = sumBy(guided, 3);
  const deployed = t1 + t2 + t3;

  const requiredT2 = t1 * FRAMEWORK.t2RatioOfT1;
  const requiredT3 = t1 * FRAMEWORK.t3RatioOfT1;
  const t2Gap = Math.max(0, requiredT2 - t2);
  const t3Gap = Math.max(0, requiredT3 - t3);
  const ratioOk = t2Gap === 0 && t3Gap === 0;

  const stage = reinvestStageFor(t1);
  const ledger = summariseLedger(events, today);

  const closed = [...trades]
    .filter(isClosed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FRAMEWORK.winRateWindow);
  const winRate = {
    rate: closed.length
      ? Math.round((closed.filter(isWin).length / closed.length) * 1000) / 10
      : null,
    sample: closed.length,
  };

  // --- T1 scale-up gate: all five must be true. ----------------------------
  const scaleUp: Check[] = [
    {
      label: `${FRAMEWORK.scaleUpPayoutStreak}+ consecutive payouts`,
      ok: ledger.payoutStreak >= FRAMEWORK.scaleUpPayoutStreak,
      detail: `${ledger.payoutStreak} since the last cut.`,
    },
    {
      label: `No cuts in ${FRAMEWORK.noCutWindowDays} days`,
      ok: ledger.cutsInWindow === 0,
      detail:
        ledger.daysSinceLastCut === null
          ? "No cuts recorded."
          : `Last cut ${ledger.daysSinceLastCut} ${ledger.daysSinceLastCut === 1 ? "day" : "days"} ago.`,
    },
    {
      label: `Win rate ${FRAMEWORK.minWinRatePct}%+ over the last ${FRAMEWORK.winRateWindow} trades`,
      ok: winRate.rate !== null && winRate.rate >= FRAMEWORK.minWinRatePct,
      detail:
        winRate.rate === null
          ? "No closed trades logged yet."
          : `${winRate.rate}% over ${winRate.sample} trades.`,
    },
    {
      label: "T2 stocked at 60% of T1",
      ok: t2Gap === 0,
      detail:
        t2Gap === 0
          ? "Fully stocked."
          : `$${Math.round(t2Gap).toLocaleString("en-US")} short.`,
    },
    {
      label: "T3 stocked at 40% of T1",
      ok: t3Gap === 0,
      detail:
        t3Gap === 0
          ? "Fully stocked."
          : `$${Math.round(t3Gap).toLocaleString("en-US")} short.`,
    },
  ];
  const scaleUpReady = scaleUp.every((c) => c.ok);

  // --- Upgrade ladder. -----------------------------------------------------
  const ladderStatuses: LadderStatus[] = UPGRADE_LADDER.map((rung) => {
    const blockers: string[] = [];
    if (t1 < rung.minT1) {
      blockers.push(
        `T1 is $${Math.round(rung.minT1 - t1).toLocaleString("en-US")} short of $${rung.minT1.toLocaleString("en-US")}`
      );
    }
    if (ledger.lifetimePayouts < rung.minPayouts) {
      blockers.push(
        `${rung.minPayouts - ledger.lifetimePayouts} more lifetime payouts needed`
      );
    }
    return { ...rung, blockers, unlocked: blockers.length === 0, current: false };
  });
  const highestUnlocked = [...ladderStatuses].reverse().find((r) => r.unlocked);
  if (highestUnlocked) highestUnlocked.current = true;
  const unlockedSize = highestUnlocked?.size ?? UPGRADE_LADDER[0].size;

  // --- Concentration: no more than 40% of T1 in an unproven size. ----------
  const t1Accounts = guided.filter((a) => a.tier === 1);
  const sizes = [...new Set(t1Accounts.map((a) => a.size))].sort((a, b) => b - a);
  const concentration: SizeConcentration[] = sizes.map((size) => {
    const capital = t1Accounts
      .filter((a) => a.size === size)
      .reduce((s, a) => s + a.size, 0);
    const share = t1 > 0 ? capital / t1 : 0;
    // A size at or below the unlocked rung is proven; anything above is not.
    const proven = size <= unlockedSize;
    return {
      size,
      capital,
      share,
      ok: proven || share <= FRAMEWORK.maxShareInUnprovenSize,
    };
  });

  // --- Staggering: two T1 accounts must never share a start date. ----------
  const byStart = new Map<string, string[]>();
  for (const a of t1Accounts) {
    if (!a.account.cycleStart) continue;
    const list = byStart.get(a.account.cycleStart) ?? [];
    list.push(a.account.name);
    byStart.set(a.account.cycleStart, list);
  }
  const staggerCollisions = [...byStart.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([date, names]) => ({ date, accounts: names }));

  // --- Spend priority: T3, then T2, then T1, then income. ------------------
  //
  // With no funded account the ratios are trivially satisfied — 60% and 40%
  // of zero is zero — so the priority list would report "hold and take
  // income" to someone who has no income. Before T1 exists the only job is
  // getting the first account funded, and the guidance says so.
  const t2Count = guided.filter((a) => a.tier === 2).length;
  const t3Count = guided.filter((a) => a.tier === 3).length;

  const nextSpend =
    t1 === 0
      ? t2Count > 0
        ? {
            step: "Pass Phase 2",
            detail: `${t2Count} ${t2Count === 1 ? "account is" : "accounts are"} one winning trade from being funded. Same calculated sizing as Phase 1 — that is what turns T2 into your first T1.`,
            amount: null,
          }
        : t3Count > 0
          ? {
              step: "Pass Phase 1",
              detail: `Rapid-pass ${t3Count === 1 ? "this evaluation" : `these ${t3Count} evaluations`} at a minimum ${FRAMEWORK.minRiskReward}:1. One or two winners is enough; a ${FRAMEWORK.minWinRatePct}% win rate carries it.`,
              amount: null,
            }
          : {
              step: "Buy your first evaluations",
              detail:
                "The framework starts with two Phase 1 evaluations of the same size. They sit in T3 until they pass.",
              amount: null,
            }
      : t3Gap > 0
      ? {
          step: "Restock T3",
          detail: `Buy Phase 1 evaluations until T3 reaches $${Math.round(requiredT3).toLocaleString("en-US")} (40% of T1).`,
          amount: t3Gap,
        }
      : t2Gap > 0
        ? {
            step: "Restock T2",
            detail: `Pass evaluations through to Phase 2 until T2 reaches $${Math.round(requiredT2).toLocaleString("en-US")} (60% of T1).`,
            amount: t2Gap,
          }
        : scaleUpReady
          ? {
              step: "Expand T1",
              detail: `All five scale-up conditions are met. Add funding at $${unlockedSize.toLocaleString("en-US")} accounts, reinvesting ${stage.reinvestPct}% of payouts.`,
              amount: null,
            }
          : {
              step: "Hold and take income",
              detail: `Ratios are correct but the scale-up gate is not clear. Take ${100 - stage.reinvestPct}% of payouts as income and keep cycling.`,
              amount: null,
            };

  // Ratios trivially hold at T1 = 0, but there is nothing to take yet.
  const personalIncomeUnlocked = ratioOk && t1 > 0;

  // --- Portfolio-level actions, merged with the per-account ones. ----------
  const actions: Action[] = guided.flatMap((a) => a.actions);

  if (t1 > 0 && t3Gap > 0) {
    actions.push({
      tone: "warn",
      title: `T3 is $${Math.round(t3Gap).toLocaleString("en-US")} short of the 40% floor`,
      detail: `T1 is $${Math.round(t1).toLocaleString("en-US")}, so T3 must hold $${Math.round(requiredT3).toLocaleString("en-US")} in Phase 1 evaluations. Without a stocked T3 the pipeline runs dry. Restock it before anything else.`,
      rule: "T3 = 40% of T1 — spend priority #1",
    });
  }
  if (t1 > 0 && t3Gap === 0 && t2Gap > 0) {
    actions.push({
      tone: "warn",
      title: `T2 is $${Math.round(t2Gap).toLocaleString("en-US")} short of the 60% floor`,
      detail: `A fully stocked T2 means zero downtime when a T1 account is cut. Do not spend on T1 expansion until this is filled.`,
      rule: "T2 = 60% of T1 — hard floor",
    });
  }
  if (!personalIncomeUnlocked && t1 > 0) {
    actions.push({
      tone: "info",
      title: "No personal income this month",
      detail:
        "T2 and T3 are not both at their required ratios, so every payout goes back into the pipeline without exception.",
      rule: "Reinvest all payouts until T2 and T3 are stocked",
    });
  }
  for (const collision of staggerCollisions) {
    actions.push({
      tone: "warn",
      title: `${collision.accounts.length} T1 accounts share the start date ${collision.date}`,
      detail: `${collision.accounts.join(", ")} will run through the same losing window together. Offset their cycle start dates by at least a week.`,
      rule: "Tier 1: stagger all account start dates",
    });
  }
  for (const c of concentration.filter((x) => !x.ok)) {
    actions.push({
      tone: "warn",
      title: `${Math.round(c.share * 100)}% of T1 is in unproven $${c.size.toLocaleString("en-US")} accounts`,
      detail: `The ladder has not unlocked this size yet, and the hard limit is ${Math.round(FRAMEWORK.maxShareInUnprovenSize * 100)}% of T1 in a size you have not traded consistently. Open one, not five.`,
      rule: "Chapter 06 hard limit",
    });
  }
  if (t1 === 0 && guided.length > 0) {
    actions.push({
      tone: "info",
      title:
        t2Count > 0
          ? "No funded accounts yet — Phase 2 is the whole job"
          : "No funded accounts yet — pass the evaluations first",
      detail: `${nextSpend.detail} Until a T1 account exists there are no payouts to reinvest, and the 60/40 tier floors have nothing to measure against.`,
      rule: "Chapter 08, steps 1–2",
    });
  }

  if (guided.length === 0) {
    actions.push({
      tone: "info",
      title: "Add your prop accounts to start",
      detail:
        "Each account needs its firm, size, and phase. Everything else — cut triggers, payout locks, cycle weeks, and the tier ratios — is worked out from there.",
      rule: "Chapter 01",
    });
  }

  return {
    accounts: guided,
    tiers: ([1, 2, 3] as Tier[]).map((tier) => {
      const capital = tier === 1 ? t1 : tier === 2 ? t2 : t3;
      const required = tier === 1 ? null : tier === 2 ? requiredT2 : requiredT3;
      return {
        tier,
        capital,
        accounts: guided.filter((a) => a.tier === tier).length,
        required,
        gap: required === null ? 0 : Math.max(0, required - capital),
        share: deployed > 0 ? capital / deployed : TIER_META[tier].share,
      };
    }),
    t1,
    t2,
    t3,
    deployed,
    requiredT2,
    requiredT3,
    ratioOk,
    stage,
    personalIncomeUnlocked,
    nextSpend,
    ledger,
    winRate,
    scaleUp,
    scaleUpReady,
    ladder: ladderStatuses,
    unlockedSize,
    concentration,
    staggerCollisions,
    progress: {
      t1: Math.min(1, t1 / FRAMEWORK.target.t1),
      t2: Math.min(1, t2 / FRAMEWORK.target.t2),
      t3: Math.min(1, t3 / FRAMEWORK.target.t3),
    },
    actions: actions.sort(byUrgency),
  };
}
