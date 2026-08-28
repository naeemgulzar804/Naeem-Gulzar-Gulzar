import type { JournalEntry, Playbook, Trade } from "@/lib/types";
import {
  CONFLUENCES,
  EMOTIONS,
  ENTRY_EXECUTIONS,
  ENTRY_MODELS,
  ENTRY_TIMES,
  H4_CANDLES,
  SESSIONS,
  SMT_PAIRS,
  SMT_QUALITIES,
  SWEEP_QUALITIES,
  TIMEFRAMES,
} from "@/lib/types";
import { criteriaMet, derivedGrade } from "@/lib/model";

// Deterministic PRNG (mulberry32) so mock data is stable across renders/builds.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260826);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

/** Picks from `arr` using matching weights, so demo data isn't uniform. */
function pickWeighted<T>(arr: readonly T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

export const PLAYBOOKS: Playbook[] = [
  {
    id: "liquidity-sweep-fvg",
    name: "Liquidity Sweep + FVG",
    summary:
      "Sweep of session/dealing-range liquidity followed by a Fair Value Gap entry back in the direction of the higher-timeframe bias.",
    rules: [
      "Mark the dealing range and prior session highs/lows",
      "Wait for a liquidity sweep during London or NY kill zone",
      "Confirm displacement leaves an FVG in the reversal direction",
      "Entry on FVG retracement, stop beyond the sweep wick",
      "Target opposing liquidity or 2R minimum",
    ],
    tags: ["liquidity", "fvg", "kill-zone"],
  },
  {
    id: "smt-divergence",
    name: "SMT Divergence Reversal",
    summary:
      "Inter-market divergence (e.g. EURUSD vs GBPUSD) at a key level, confirming a false move before reversal.",
    rules: [
      "Identify correlated pair failing to make the same high/low",
      "Confluence with a dealing-range extreme",
      "Wait for CHoCH on the entry timeframe",
      "Entry on retest of the CHoCH orderblock",
    ],
    tags: ["smt", "divergence", "reversal"],
  },
  {
    id: "orderblock-retest",
    name: "Orderblock Retest",
    summary:
      "Continuation entry on a retest of the last-down/last-up candle before an impulsive displacement.",
    rules: [
      "Displacement breaks structure with strong momentum",
      "Mark the origin orderblock of the move",
      "Enter on first retest with rejection confirmation",
      "Stop beyond the orderblock, target next liquidity pool",
    ],
    tags: ["orderblock", "continuation"],
  },
  {
    id: "killzone-breakout",
    name: "Kill Zone Range Breakout",
    summary:
      "Asian range breakout during the London kill zone, trading with the initial displacement.",
    rules: [
      "Mark the Asian session range",
      "Wait for London kill zone displacement through the range",
      "Entry on the retest of the broken range edge",
      "Stop inside the range, target measured move",
    ],
    tags: ["breakout", "session-range", "kill-zone"],
  },
];

const SYMBOLS = [
  { symbol: "EURUSD", base: 1.09, pip: 0.0001, weight: 5 },
  { symbol: "GBPUSD", base: 1.27, pip: 0.0001, weight: 2 },
  { symbol: "XAUUSD", base: 2430, pip: 0.1, weight: 2 },
  { symbol: "USDJPY", base: 152, pip: 0.01, weight: 1 },
] as const;

function weightedSymbol() {
  const pool = SYMBOLS.flatMap((s) => Array(s.weight).fill(s));
  return pick(pool);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function generateTrades(): Trade[] {
  const trades: Trade[] = [];
  // Six months rather than three: the pattern engine needs a real history to
  // find anything, and a demo set that shows an empty Patterns page teaches
  // the wrong lesson about the feature.
  const start = new Date("2026-03-02T00:00:00Z");
  const end = new Date("2026-08-25T00:00:00Z");
  const RISK = 250; // $ per 1R at a fixed prop-account risk size
  let tradeIndex = 0;

  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const day = d.getUTCDay();
    if (day === 0 || day === 6) continue; // skip weekends

    const tradesToday = rand() < 0.6 ? (rand() < 0.7 ? 1 : 2) : 0;

    for (let i = 0; i < tradesToday; i++) {
      const { symbol, base, pip } = weightedSymbol();
      const playbook = pick(PLAYBOOKS);
      const side = rand() < 0.5 ? "long" : "short";

      // The three model criteria come first; grade is derived from them, the
      // same way the form now works. Win probability follows the criteria
      // rather than a grade picked out of the air, so the demo history
      // behaves like a real one under the pattern engine.
      const dailyAligned = rand() < 0.66;
      const smtQuality = pickWeighted(SMT_QUALITIES, [0.5, 0.26, 0.16, 0.08]);
      const sweepQuality = pickWeighted(SWEEP_QUALITIES, [0.55, 0.3, 0.15]);
      const criteria = { dailyAligned, smtQuality, sweepQuality };
      const grade = derivedGrade(criteria) ?? "C";
      const met = criteriaMet(criteria);

      // Entering early instead of waiting for the OB retest is the model's
      // recurring execution mistake, and it is made to cost here so the
      // Patterns page has something real to find in the demo history.
      const entryExecution = pickWeighted(ENTRY_EXECUTIONS, [0.58, 0.28, 0.09, 0.05]);
      const executionPenalty =
        entryExecution === "Early — engulfing candle" ? 0.16 : 0;

      const winProbability =
        (met === 3 ? 0.76 : met === 2 ? 0.46 : met === 1 ? 0.32 : 0.22) -
        executionPenalty;
      const isWin = rand() < winProbability;

      let rMultiple: number;
      if (isWin) {
        rMultiple =
          grade === "A+" || grade === "A" ? 1.5 + rand() * 2.5 : 1 + rand() * 1.5;
      } else {
        rMultiple = -(0.8 + rand() * 0.3); // partial-stop variance
      }
      rMultiple = Math.round(rMultiple * 100) / 100;
      const pnl = Math.round(rMultiple * RISK * 100) / 100;

      const entryPrice = Math.round((base + (rand() - 0.5) * base * 0.01) / pip) * pip;
      const priceMove = (rMultiple * RISK) / (10000 * pip * 10); // cosmetic price delta
      const exitPrice =
        side === "long"
          ? entryPrice + priceMove * pip * 100
          : entryPrice - priceMove * pip * 100;

      const risk = Math.abs(entryPrice - exitPrice) / Math.max(Math.abs(rMultiple), 0.1);
      const stopLoss = side === "long" ? entryPrice - risk : entryPrice + risk;
      const takeProfit = side === "long" ? entryPrice + risk * 2 : entryPrice - risk * 2;
      const isoDay = isoDate(d);

      tradeIndex += 1;
      trades.push({
        id: `t-${tradeIndex}`,
        accountId: null,
        date: isoDay,
        symbol,
        side,
        playbook: playbook.name,
        grade,
        result: isWin ? "Win" : "Loss",

        day: new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        }),
        session: pick(SESSIONS),
        timeframe: pick(TIMEFRAMES),
        dailyBias: side === "long" ? "Bullish" : "Bearish",
        marketCondition: rand() < 0.6 ? "Imbalanced" : "Balanced",
        h4Candle: pick(H4_CANDLES),
        liquidityPurge: rand() < 0.65,
        entryModel: pick(ENTRY_MODELS),
        entryTime: pick(ENTRY_TIMES),

        dailyAligned,
        smtQuality,
        smtPair: smtQuality === "None" ? "None" : pick(SMT_PAIRS.slice(0, 3)),
        sweepQuality,
        entryExecution,

        entryPrice: Math.round(entryPrice * 100000) / 100000,
        exitPrice: Math.round(exitPrice * 100000) / 100000,
        stopLoss: Math.round(stopLoss * 100000) / 100000,
        takeProfit: Math.round(takeProfit * 100000) / 100000,
        plannedRR: 2,

        // Excursions consistent with the outcome: a winner that ran past its
        // close, a loser that was briefly onside. Both sit the correct side
        // of entry for the trade's direction.
        maePrice:
          side === "long"
            ? entryPrice - risk * (0.3 + rand() * 0.6)
            : entryPrice + risk * (0.3 + rand() * 0.6),
        mfePrice:
          side === "long"
            ? entryPrice + risk * (isWin ? rMultiple + rand() * 0.8 : rand() * 1.4)
            : entryPrice - risk * (isWin ? rMultiple + rand() * 0.8 : rand() * 1.4),

        size: Math.round((0.5 + rand() * 1.5) * 10) / 10,
        riskAmount: RISK,
        riskPct: grade === "A+" && dailyAligned ? 1 : rand() < 0.75 ? 0.5 : 1,
        rMultiple,
        pnl,
        durationMinutes: Math.round(15 + rand() * 210),

        confluences: CONFLUENCES.filter(() => rand() < 0.28),

        emotionBefore: pick(EMOTIONS),
        emotionDuring: pick(EMOTIONS),
        emotionAfter: isWin ? pick(["Confident", "Calm", "Disciplined"]) : pick(["Frustrated" as string, "Uncertain", "Neutral"]),
        confidence: Math.max(1, Math.min(10, Math.round(3 + rand() * 7))),

        entryReason: `${playbook.name} setup aligned with the ${side === "long" ? "bullish" : "bearish"} higher-timeframe bias.`,
        exitReason: isWin ? "Target hit at planned liquidity pool." : "Stopped out on retracement.",
        mistakes: isWin ? "" : "Entered slightly early before full confirmation.",
        lessons: isWin ? "Trusting the target paid off." : "Wait for the retest to close before entering.",
        notes: isWin
          ? `Clean ${playbook.name.toLowerCase()} setup, followed plan and let it run to target.`
          : `Valid ${playbook.name.toLowerCase()} setup but got stopped on retracement — no rule violation.`,
        tags: playbook.tags,

        screenshotDailyPath: null,
        screenshotH4Path: null,
        screenshot15mPath: null,
      });
    }
  }

  return trades;
}

export const TRADES: Trade[] = generateTrades();

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "j-1",
    date: "2026-08-25",
    title: "Patient on the London sweep",
    mood: "disciplined",
    content:
      "Waited for the Asian range sweep before committing. Two A+ setups today on EURUSD, both followed the playbook exactly — no early entries. Best session in two weeks in terms of discipline.",
    linkedTradeIds: [],
  },
  {
    id: "j-2",
    date: "2026-08-20",
    title: "Forced a B-grade trade into NY close",
    mood: "frustrated",
    content:
      "Chased a late-session move on GBPUSD without full confluence — no clean SMT divergence, entered anyway. Small loss but the real cost was breaking process this late in the week. Reviewing kill-zone discipline this weekend.",
    linkedTradeIds: [],
  },
  {
    id: "j-3",
    date: "2026-08-13",
    title: "Orderblock retest paid exactly as planned",
    mood: "confident",
    content:
      "Structure break was clean, retest held the orderblock on the first touch. Let it run past 2R into the next liquidity pool instead of taking an early partial. Trusting the target more this month.",
    linkedTradeIds: [],
  },
  {
    id: "j-4",
    date: "2026-08-01",
    title: "Monthly review — July",
    mood: "neutral",
    content:
      "July net positive but win rate on B-grade setups is dragging the average. Plan for August: only take B-grade trades with at least two extra confluences, otherwise skip and wait for A+.",
    linkedTradeIds: [],
  },
  {
    id: "j-5",
    date: "2026-07-22",
    title: "SMT divergence on EUR/GBP paid off",
    mood: "confident",
    content:
      "GBPUSD failed to sweep the prior low while EURUSD did — clear SMT. Took the reversal on the CHoCH retest, full size, ran to target. This is the highest-quality setup in the playbook right now.",
    linkedTradeIds: [],
  },
  {
    id: "j-6",
    date: "2026-07-10",
    title: "Overtrading on a choppy Thursday",
    mood: "frustrated",
    content:
      "Three trades today, only one was a real setup. Range-bound conditions all session and I kept forcing kill-zone breakouts that had no real displacement behind them. Cutting size on low-conviction days going forward.",
    linkedTradeIds: [],
  },
  {
    id: "j-7",
    date: "2026-06-15",
    title: "Back-to-back liquidity sweep wins",
    mood: "confident",
    content:
      "Two clean liquidity-sweep-plus-FVG entries this week, both A+ grade. Sizing felt right, exits were mechanical at target. This is the setup I want to specialize in for Q3.",
    linkedTradeIds: [],
  },
];
