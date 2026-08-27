import type { AccountSettings, Trade, TradeGrade } from "@/lib/types";
import { isKillZone } from "@/lib/types";

/*
 * The trading model's own rules, in one place.
 *
 * A setup is A+ only when all three criteria are present: Daily timeframe bias
 * agrees with the H4 direction, SMT divergence on GBPUSD/DXY is clear, and the
 * H4 liquidity sweep is clean. Two of three is a B-grade setup at half risk;
 * one or none is not a trade.
 *
 * Grade is derived from those answers rather than self-reported, which is the
 * point — the old checklist asked "is this A+?" as one of its own criteria.
 */

export interface ModelCriteria {
  dailyAligned: boolean | null;
  smtQuality: string;
  sweepQuality: string;
}

export interface CriterionState {
  key: "daily" | "smt" | "sweep";
  label: string;
  /** True when met, false when explicitly not met, null when unanswered. */
  met: boolean | null;
  detail: string;
}

export function criteriaStates(t: ModelCriteria): CriterionState[] {
  return [
    {
      key: "daily",
      label: "Daily bias aligns with H4 direction",
      met: t.dailyAligned,
      detail:
        t.dailyAligned === null
          ? "Not recorded"
          : t.dailyAligned
            ? "Aligned"
            : "Not aligned — half risk",
    },
    {
      key: "smt",
      label: "SMT divergence is clear",
      met: t.smtQuality ? t.smtQuality === "Clear" : null,
      detail: t.smtQuality || "Not recorded",
    },
    {
      key: "sweep",
      label: "H4 liquidity sweep is clean",
      met: t.sweepQuality ? t.sweepQuality === "Clean" : null,
      detail: t.sweepQuality || "Not recorded",
    },
  ];
}

/** How many of the three criteria are confirmed met. */
export function criteriaMet(t: ModelCriteria) {
  return criteriaStates(t).filter((c) => c.met === true).length;
}

/** True once every criterion has an answer either way. */
export function criteriaComplete(t: ModelCriteria) {
  return criteriaStates(t).every((c) => c.met !== null);
}

/**
 * The grade the model implies. Returns null while any criterion is still
 * unanswered — guessing a grade from a half-filled form would be worse than
 * showing nothing.
 */
export function derivedGrade(t: ModelCriteria): TradeGrade | null {
  if (!criteriaComplete(t)) return null;
  const met = criteriaMet(t);
  if (met === 3) return "A+";
  if (met === 2) return "B";
  return "C";
}

/** Plain-language reading of a derived grade. */
export function gradeVerdict(grade: TradeGrade | null) {
  switch (grade) {
    case "A+":
      return { title: "A+ setup", detail: "All three criteria. Full risk." };
    case "A":
      return { title: "A setup", detail: "Strong, but not the full three." };
    case "B":
      return {
        title: "B-grade setup",
        detail: "Two of three. Half risk, or skip it.",
      };
    case "C":
      return {
        title: "Not a trade",
        detail: "One criterion or fewer. The model says stand down.",
      };
    default:
      return {
        title: "Building setup…",
        detail: "Answer all three criteria to see the grade.",
      };
  }
}

/** The risk the model allows for this trade, in percent. */
export function allowedRiskPct(
  t: ModelCriteria,
  settings: AccountSettings
): number | null {
  const grade = derivedGrade(t);
  if (grade === null) return null;
  if (grade === "A+" && t.dailyAligned) return settings.riskPctAligned;
  return settings.riskPctUnaligned;
}

/**
 * Whether the trade was sized within what the model allowed. A small tolerance
 * covers rounding in lot sizing rather than genuine over-risking.
 */
export function sizedCorrectly(
  t: Trade,
  settings: AccountSettings
): boolean | null {
  const allowed = allowedRiskPct(t, settings);
  if (allowed === null || !t.riskPct) return null;
  return t.riskPct <= allowed + 0.05;
}

/** Trades where every model criterion is recorded — the analysable set. */
export function withCriteria(trades: Trade[]) {
  return trades.filter(criteriaComplete);
}

export { isKillZone };
