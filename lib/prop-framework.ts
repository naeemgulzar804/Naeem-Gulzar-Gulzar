/*
 * The 3-Tier Prop Firm Framework, encoded.
 *
 * Every number in this file comes from the framework guide, and nothing in it
 * is a preference: the tier ratio, the cut triggers, the payout lock, and both
 * ladders are the rules the rest of the app measures accounts against. Keeping
 * them in one place means the guidance can cite where it came from, and means
 * changing a rule is a one-line edit rather than a hunt through components.
 */

export type PropPhase = "phase1" | "phase2" | "funded";
export type Tier = 1 | 2 | 3;

/** Tier is always derived from phase, never stored alongside it. */
export const TIER_BY_PHASE: Record<PropPhase, Tier> = {
  funded: 1,
  phase2: 2,
  phase1: 3,
};

export const PHASE_LABEL: Record<PropPhase, string> = {
  funded: "Funded",
  phase2: "Phase 2",
  phase1: "Phase 1 eval",
};

export const TIER_META: Record<
  Tier,
  { name: string; role: string; job: string; share: number }
> = {
  1: {
    name: "Tier 1",
    role: "Income engine",
    job: "Fully funded master accounts. This is where payouts come from.",
    share: 0.5,
  },
  2: {
    name: "Tier 2",
    role: "Immediate backup",
    job: "Phase 2 accounts. One winning trade away from becoming a T1 account.",
    share: 0.3,
  },
  3: {
    name: "Tier 3",
    role: "Future pipeline",
    job: "Phase 1 evaluations being passed. These feed T2.",
    share: 0.2,
  },
};

export const FRAMEWORK = {
  /** T2 and T3 are sized against T1, not against the total. */
  t2RatioOfT1: 0.6,
  t3RatioOfT1: 0.4,

  /** Lock the payout the moment a funded account is up this much. */
  payoutTriggerPct: 3,

  /** Cut and rebuy at this drawdown. Tighter in Phase 2 and Phase 1. */
  cutTriggerPct: { 1: 6, 2: 4, 3: 4 } as Record<Tier, number>,

  /** Each funded account trades four weeks, then rests one. */
  cycleOnWeeks: 4,
  cycleOffWeeks: 1,

  /** Rapid-pass rules. */
  minRiskReward: 3,
  minWinRatePct: 40,
  winRateWindow: 20,

  /** T1 scale-up gates. */
  scaleUpPayoutStreak: 3,
  noCutWindowDays: 14,

  /** Never put more than this share of T1 into an unproven account size. */
  maxShareInUnprovenSize: 0.4,

  /** The finish line. */
  target: { t1: 500_000, t2: 300_000, t3: 200_000 },
} as const;

export interface LadderRung {
  size: number;
  minT1: number;
  minPayouts: number;
  condition: string;
}

/** Account size upgrade ladder — Chapter 06. */
export const UPGRADE_LADDER: LadderRung[] = [
  {
    size: 25_000,
    minT1: 0,
    minPayouts: 0,
    condition: "The entry point. Prove the system here first.",
  },
  {
    size: 50_000,
    minT1: 100_000,
    minPayouts: 10,
    condition: "Pass one $50K eval before buying multiples.",
  },
  {
    size: 100_000,
    minT1: 300_000,
    minPayouts: 25,
    condition: "Pass one $100K eval before buying multiples.",
  },
  {
    size: 200_000,
    minT1: 500_000,
    minPayouts: 50,
    condition: "Only if the prop firm allows — a separate decision.",
  },
];

export interface ReinvestStage {
  stage: number;
  name: string;
  t1From: number;
  /** Exclusive upper bound; Infinity on the last stage. */
  t1To: number;
  reinvestPct: number;
  priority: string;
}

/** The reinvestment ladder — Chapter 07. */
export const REINVEST_LADDER: ReinvestStage[] = [
  {
    stage: 1,
    name: "Seed",
    t1From: 0,
    t1To: 100_000,
    reinvestPct: 80,
    priority: "Build the pipeline first",
  },
  {
    stage: 2,
    name: "Build",
    t1From: 100_000,
    t1To: 300_000,
    reinvestPct: 65,
    priority: "Expand account sizes",
  },
  {
    stage: 3,
    name: "Scale",
    t1From: 300_000,
    t1To: 500_000,
    reinvestPct: 50,
    priority: "Final push to target",
  },
  {
    stage: 4,
    name: "Sustain",
    t1From: 500_000,
    t1To: Infinity,
    reinvestPct: 30,
    priority: "Replace accounts only, keep the rest",
  },
];

export function reinvestStageFor(t1Capital: number): ReinvestStage {
  return (
    REINVEST_LADDER.find((s) => t1Capital >= s.t1From && t1Capital < s.t1To) ??
    REINVEST_LADDER[REINVEST_LADDER.length - 1]
  );
}

/** What to do the moment a cut trigger fires — Chapter 09. */
export const CUT_PLAYBOOK: Record<Tier, string> = {
  1: "Cut immediately. Promote a T2 account to T1. Rebuy a Phase 1 eval for T3.",
  2: "Cut. Rebuy a Phase 1 eval using T3 funds. Add it straight into T3.",
  3: "Cut. Rebuy immediately from payout reinvestment. Restart the rapid pass from zero.",
};

/** Spend priority for every payout, in order — Chapter 07. */
export const SPEND_PRIORITY = [
  "Restock the T3 pipeline",
  "Restock T2 to 60% of T1",
  "Expand T1",
  "Personal income",
] as const;
