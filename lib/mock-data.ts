import type {
  DailyPnl,
  JournalEntry,
  Playbook,
  Stats,
  Trade,
} from "@/lib/types";

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
  const start = new Date("2026-06-01T00:00:00Z");
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
      const grade = rand() < 0.45 ? "A+" : "B";
      const side = rand() < 0.5 ? "long" : "short";
      const winProbability = grade === "A+" ? 0.68 : 0.48;
      const isWin = rand() < winProbability;

      let rMultiple: number;
      if (isWin) {
        rMultiple = grade === "A+" ? 1.5 + rand() * 2.5 : 1 + rand() * 1.5;
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

      tradeIndex += 1;
      trades.push({
        id: `t-${tradeIndex}`,
        date: isoDate(d),
        symbol,
        side,
        playbook: playbook.name,
        grade,
        entryPrice: Math.round(entryPrice * 100000) / 100000,
        exitPrice: Math.round(exitPrice * 100000) / 100000,
        size: Math.round((0.5 + rand() * 1.5) * 10) / 10,
        riskAmount: RISK,
        rMultiple,
        pnl,
        durationMinutes: Math.round(15 + rand() * 210),
        tags: playbook.tags,
        notes: isWin
          ? `Clean ${playbook.name.toLowerCase()} setup, followed plan and let it run to target.`
          : `Valid ${playbook.name.toLowerCase()} setup but got stopped on retracement — no rule violation.`,
      });
    }
  }

  return trades;
}

export const TRADES: Trade[] = generateTrades();

export function getDailyPnl(): DailyPnl[] {
  const map = new Map<string, DailyPnl>();
  for (const t of TRADES) {
    const existing = map.get(t.date) ?? {
      date: t.date,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
    };
    existing.pnl = Math.round((existing.pnl + t.pnl) * 100) / 100;
    existing.trades += 1;
    if (t.pnl >= 0) existing.wins += 1;
    else existing.losses += 1;
    map.set(t.date, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function getEquityCurve(startingBalance = 50000) {
  const daily = getDailyPnl();
  let running = startingBalance;
  return daily.map((d) => {
    running = Math.round((running + d.pnl) * 100) / 100;
    return { date: d.date, balance: running, pnl: d.pnl };
  });
}

export function getStats(): Stats {
  const wins = TRADES.filter((t) => t.pnl >= 0);
  const losses = TRADES.filter((t) => t.pnl < 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = Math.round((grossWin - grossLoss) * 100) / 100;
  const daily = getDailyPnl();
  const bestDay = daily.reduce<DailyPnl | null>(
    (best, d) => (!best || d.pnl > best.pnl ? d : best),
    null
  );
  const worstDay = daily.reduce<DailyPnl | null>(
    (worst, d) => (!worst || d.pnl < worst.pnl ? d : worst),
    null
  );

  let currentStreak: Stats["currentStreak"] = { type: "win", count: 0 };
  for (let i = TRADES.length - 1; i >= 0; i--) {
    const isWin = TRADES[i].pnl >= 0;
    const type = isWin ? "win" : "loss";
    if (currentStreak.count === 0) {
      currentStreak = { type, count: 1 };
    } else if (currentStreak.type === type) {
      currentStreak.count += 1;
    } else {
      break;
    }
  }

  return {
    netPnl,
    winRate: Math.round((wins.length / TRADES.length) * 1000) / 10,
    profitFactor: Math.round((grossWin / grossLoss) * 100) / 100,
    avgWin: Math.round((grossWin / (wins.length || 1)) * 100) / 100,
    avgLoss: Math.round((grossLoss / (losses.length || 1)) * 100) / 100,
    avgR:
      Math.round(
        (TRADES.reduce((s, t) => s + t.rMultiple, 0) / TRADES.length) * 100
      ) / 100,
    bestDay,
    worstDay,
    totalTrades: TRADES.length,
    currentStreak,
  };
}

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
