import type { Trade, TradePattern } from "@/lib/types";

/*
 * Pattern detection over the trade history.
 *
 * The hard part here is not finding patterns — it is *not* reporting noise.
 * Slice 45 trades enough ways and something will look like a 100% edge purely
 * by chance, and a journal that confidently reports luck as skill is worse
 * than one that reports nothing. Three guards:
 *
 *   1. A minimum sample size, so two lucky trades never become a "pattern".
 *   2. A minimum lift over the trader's own baseline, so ordinary variation
 *      doesn't surface.
 *   3. A binomial-style significance check, so a small sample has to deviate
 *      further than a large one to earn the same billing.
 *
 * Findings then land in one of two tiers — confirmed, or provisional — and
 * the page has to keep them visually distinct, because the whole value of
 * the weaker tier is that it is labelled as weak.
 */

export const MIN_SAMPLE = 8;
export const MIN_LIFT = 15; // percentage points away from baseline

/*
 * Multiple comparisons are the whole difficulty here. This engine tests
 * ~60 slices per run; at a naive 80%-confidence threshold roughly a dozen
 * of them clear the bar on pure noise, so a random history would "discover"
 * several confident edges. Measured empirically: 97% of random runs produced
 * at least one finding.
 *
 * So the threshold is Bonferroni-corrected by the number of hypotheses
 * actually tested. That deliberately makes the page quiet on small histories
 * — which is the honest outcome, because 45 coin flips genuinely cannot
 * distinguish a real edge from variance.
 */
const FAMILY_ALPHA = 0.05;
const MIN_Z_FLOOR = 2.5;

/*
 * The corrected bar above is honest but blunt: on a genuinely strong edge it
 * only fires ~5% of the time at 45 closed trades, so a young journal shows
 * an empty page forever. Anything clearing an ordinary uncorrected 95% test
 * but not the corrected one is reported separately as *provisional* — worth
 * watching, explicitly not confirmed. Keeping the two tiers visually and
 * verbally distinct is what makes showing the weaker tier defensible.
 */
const WATCH_Z = 1.96;

/** Acklam-style inverse normal CDF; accurate enough for a threshold. */
function inverseNormalCdf(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969,
             138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887,
             66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184,
             -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143,
             3.75440866190742];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p > 1 - pLow) return -inverseNormalCdf(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
         (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

/** Two-sided Bonferroni-corrected z threshold for `tests` hypotheses. */
function correctedZThreshold(tests: number) {
  const alpha = FAMILY_ALPHA / Math.max(tests, 1);
  return Math.max(MIN_Z_FLOOR, Math.abs(inverseNormalCdf(alpha / 2)));
}

const isWin = (t: Trade) => t.result === "Win";
const isClosed = (t: Trade) => t.result === "Win" || t.result === "Loss";

interface Candidate {
  title: string;
  detail: string;
  subset: Trade[];
}

/**
 * How many standard deviations the subset's win rate sits from the baseline,
 * under the null hypothesis that the subset is drawn from the same
 * distribution as everything else.
 */
function zScore(wins: number, n: number, baselineRate: number) {
  const p = baselineRate / 100;
  if (n === 0 || p <= 0 || p >= 1) return 0;
  const expected = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  return sd === 0 ? 0 : (wins - expected) / sd;
}

/** A candidate that cleared sample-size and lift screening, with its z. */
interface Scored {
  pattern: TradePattern;
  z: number;
}

/**
 * Roughly how many more trades in this group would be needed to clear the
 * corrected bar, assuming the observed rate holds. z grows with sqrt(n), so
 * the required n scales as (threshold / current z)^2.
 */
function tradesToConfirm(z: number, n: number, threshold: number) {
  if (z === 0) return null;
  const needed = Math.ceil(n * (threshold / Math.abs(z)) ** 2);
  const extra = needed - n;
  return extra > 0 ? extra : null;
}

function score(
  candidate: Candidate,
  baselineRate: number,
  idPrefix: string
): Scored | null {
  const closed = candidate.subset.filter(isClosed);
  if (closed.length < MIN_SAMPLE) return null;

  const wins = closed.filter(isWin).length;
  const rate = (wins / closed.length) * 100;
  const lift = rate - baselineRate;
  if (Math.abs(lift) < MIN_LIFT) return null;

  return {
    z: zScore(wins, closed.length, baselineRate),
    pattern: {
      id: `${idPrefix}-${candidate.title}`,
      title: candidate.title,
      detail: candidate.detail,
      kind: lift > 0 ? "edge" : "leak",
      rate: Math.round(rate * 10) / 10,
      lift: Math.round(lift * 10) / 10,
      sampleSize: closed.length,
    },
  };
}

function label(value: string) {
  return value && value.trim() ? value : "Unspecified";
}

/** Cross-tabs two trade fields and returns every non-empty combination. */
function combinations(
  trades: Trade[],
  a: keyof Trade,
  b: keyof Trade,
  render: (av: string, bv: string) => string
): Candidate[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const av = String(t[a] ?? "");
    const bv = String(t[b] ?? "");
    if (!av || !bv) continue;
    const key = `${av}||${bv}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return Array.from(groups.entries()).map(([key, subset]) => {
    const [av, bv] = key.split("||");
    return { title: render(label(av), label(bv)), detail: "", subset };
  });
}

function single(
  trades: Trade[],
  field: keyof Trade,
  render: (v: string) => string
): Candidate[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const v = String(t[field] ?? "");
    if (!v) continue;
    groups.set(v, [...(groups.get(v) ?? []), t]);
  }
  return Array.from(groups.entries()).map(([v, subset]) => ({
    title: render(label(v)),
    detail: "",
    subset,
  }));
}

/** Trades taken on a day that already had 3+ trades. */
function overtradingCandidate(trades: Trade[]): Candidate | null {
  const byDate = new Map<string, Trade[]>();
  for (const t of trades) {
    byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
  }
  const busy = Array.from(byDate.values()).filter((day) => day.length >= 3);
  const subset = busy.flat();
  if (!subset.length) return null;
  return {
    title: "Trades on 3+ trade days",
    detail: `Across ${busy.length} busier-than-usual days.`,
    subset,
  };
}

/** The next trade taken after a loss, on the same day. */
function revengeCandidate(trades: Trade[]): Candidate | null {
  const byDate = new Map<string, Trade[]>();
  for (const t of trades) {
    byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
  }

  const subset: Trade[] = [];
  for (const day of byDate.values()) {
    for (let i = 1; i < day.length; i++) {
      if (day[i - 1].result === "Loss") subset.push(day[i]);
    }
  }
  if (!subset.length) return null;
  return {
    title: "The trade right after a loss",
    detail: "Same-day trades taken immediately following a losing trade.",
    subset,
  };
}

/** Trades tagged with a given confluence. */
function confluenceCandidates(trades: Trade[]): Candidate[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    for (const c of t.confluences) {
      groups.set(c, [...(groups.get(c) ?? []), t]);
    }
  }
  return Array.from(groups.entries()).map(([c, subset]) => ({
    title: `Confluence: ${c}`,
    detail: "",
    subset,
  }));
}

export interface PatternReport {
  baselineRate: number;
  closedCount: number;
  /** True when there simply isn't enough history to say anything yet. */
  insufficientData: boolean;
  /** How many slices were examined — sets the significance bar. */
  hypothesesTested: number;
  /** Cleared the multiple-comparisons-corrected bar. Act on these. */
  edges: TradePattern[];
  leaks: TradePattern[];
  /**
   * Cleared an ordinary 95% test but not the corrected one. Suggestive,
   * not established — a few of these are expected on pure chance.
   */
  watchEdges: TradePattern[];
  watchLeaks: TradePattern[];
}

export function findPatterns(trades: Trade[]): PatternReport {
  const closed = trades.filter(isClosed);
  const baselineRate = closed.length
    ? (closed.filter(isWin).length / closed.length) * 100
    : 0;

  // Below roughly 15 closed trades, every "pattern" is noise.
  if (closed.length < 15) {
    return {
      baselineRate: Math.round(baselineRate * 10) / 10,
      closedCount: closed.length,
      insufficientData: true,
      hypothesesTested: 0,
      edges: [],
      leaks: [],
      watchEdges: [],
      watchLeaks: [],
    };
  }

  // Every slice examined counts as a hypothesis, whether or not it clears
  // screening — that total sets the significance bar.
  let hypotheses = 0;
  const scored: Scored[] = [];
  const add = (candidates: (Candidate | null)[], prefix: string) => {
    for (const c of candidates) {
      if (!c) continue;
      hypotheses += 1;
      const s = score(c, baselineRate, prefix);
      if (s) scored.push(s);
    }
  };

  add(single(closed, "session", (v) => `${v} session`), "sess");
  add(single(closed, "entryTime", (v) => `${v} entries`), "et");
  add(single(closed, "day", (v) => `${v}s`), "day");
  add(single(closed, "grade", (v) => `${v} setups`), "grade");
  add(single(closed, "entryModel", (v) => `${v} model`), "em");
  add(single(closed, "emotionBefore", (v) => `Feeling ${v.toLowerCase()} beforehand`), "emo");
  add(confluenceCandidates(closed), "conf");

  add(
    combinations(closed, "grade", "session", (g, s) => `${g} setups in ${s}`),
    "gxs"
  );
  add(
    combinations(closed, "grade", "entryTime", (g, e) => `${g} setups at ${e}`),
    "gxe"
  );
  add(
    combinations(closed, "day", "entryTime", (d, e) => `${d} at ${e}`),
    "dxe"
  );

  add([overtradingCandidate(closed)], "over");
  add([revengeCandidate(closed)], "revenge");

  const threshold = correctedZThreshold(hypotheses);

  // Strongest evidence first. Titles are deduplicated across both tiers at
  // once, so a slice never appears as confirmed and provisional together.
  const seen = new Set<string>();
  const ranked = scored
    .filter((s) => Math.abs(s.z) >= WATCH_Z)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .filter((s) => {
      if (seen.has(s.pattern.title)) return false;
      seen.add(s.pattern.title);
      return true;
    });

  const confirmed = ranked
    .filter((s) => Math.abs(s.z) >= threshold)
    .map((s) => s.pattern);

  const provisional = ranked
    .filter((s) => Math.abs(s.z) < threshold)
    .map((s) => ({
      ...s.pattern,
      moreTradesNeeded:
        tradesToConfirm(s.z, s.pattern.sampleSize, threshold) ?? undefined,
    }));

  return {
    baselineRate: Math.round(baselineRate * 10) / 10,
    closedCount: closed.length,
    insufficientData: false,
    hypothesesTested: hypotheses,
    edges: confirmed.filter((p) => p.kind === "edge").slice(0, 8),
    leaks: confirmed.filter((p) => p.kind === "leak").slice(0, 8),
    watchEdges: provisional.filter((p) => p.kind === "edge").slice(0, 5),
    watchLeaks: provisional.filter((p) => p.kind === "leak").slice(0, 5),
  };
}
