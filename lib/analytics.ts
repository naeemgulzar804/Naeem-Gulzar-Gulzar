import type { DailyPnl, GroupWinRate, Stats, Trade } from "@/lib/types";

const isWin = (t: Trade) => t.result === "Win";
const isLoss = (t: Trade) => t.result === "Loss";
const isClosed = (t: Trade) => isWin(t) || isLoss(t);

export function getDailyPnl(trades: Trade[]): DailyPnl[] {
  const map = new Map<string, DailyPnl>();
  for (const t of trades) {
    const existing = map.get(t.date) ?? {
      date: t.date,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
    };
    existing.pnl = Math.round((existing.pnl + t.pnl) * 100) / 100;
    existing.trades += 1;
    if (isWin(t)) existing.wins += 1;
    else if (isLoss(t)) existing.losses += 1;
    map.set(t.date, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function getEquityCurve(trades: Trade[], startingBalance = 50000) {
  const daily = getDailyPnl(trades);
  let running = startingBalance;
  return daily.map((d) => {
    running = Math.round((running + d.pnl) * 100) / 100;
    return { date: d.date, balance: running, pnl: d.pnl };
  });
}

/** Win rate for the subset of trades where `key` equals `value`. */
export function groupWinRate(
  trades: Trade[],
  key: keyof Trade,
  value: unknown
): GroupWinRate | null {
  const matching = trades.filter((t) => t[key] === value && isClosed(t));
  if (!matching.length) return null;
  const wins = matching.filter(isWin).length;
  return {
    rate: Math.round((wins / matching.length) * 1000) / 10,
    count: matching.length,
    wins,
  };
}

/** Win rate across trades tagged with a given confluence. */
export function confluenceWinRate(
  trades: Trade[],
  confluence: string
): GroupWinRate | null {
  const matching = trades.filter(
    (t) => t.confluences.includes(confluence) && isClosed(t)
  );
  if (!matching.length) return null;
  const wins = matching.filter(isWin).length;
  return {
    rate: Math.round((wins / matching.length) * 1000) / 10,
    count: matching.length,
    wins,
  };
}

export function getStats(trades: Trade[]): Stats {
  if (trades.length === 0) {
    return {
      netPnl: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      avgR: 0,
      bestDay: null,
      worstDay: null,
      totalTrades: 0,
      currentStreak: { type: "win", count: 0 },
    };
  }

  const closed = trades.filter(isClosed);
  const wins = closed.filter(isWin);
  const losses = closed.filter(isLoss);
  const grossWin = wins.reduce((s, t) => s + Math.abs(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = Math.round(trades.reduce((s, t) => s + t.pnl, 0) * 100) / 100;
  const daily = getDailyPnl(trades);
  const bestDay = daily.reduce<DailyPnl | null>(
    (best, d) => (!best || d.pnl > best.pnl ? d : best),
    null
  );
  const worstDay = daily.reduce<DailyPnl | null>(
    (worst, d) => (!worst || d.pnl < worst.pnl ? d : worst),
    null
  );

  const byDateAsc = [...closed].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak: Stats["currentStreak"] = { type: "win", count: 0 };
  for (let i = byDateAsc.length - 1; i >= 0; i--) {
    const type = isWin(byDateAsc[i]) ? "win" : "loss";
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
    winRate: closed.length
      ? Math.round((wins.length / closed.length) * 1000) / 10
      : 0,
    profitFactor:
      grossLoss === 0 ? grossWin : Math.round((grossWin / grossLoss) * 100) / 100,
    avgWin: Math.round((grossWin / (wins.length || 1)) * 100) / 100,
    avgLoss: Math.round((grossLoss / (losses.length || 1)) * 100) / 100,
    avgR:
      Math.round(
        (trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length) * 100
      ) / 100,
    bestDay,
    worstDay,
    totalTrades: trades.length,
    currentStreak,
  };
}

/*
 * Expectancy: the average R gained per trade taken. With a fixed 1:3 target
 * this is the number that says whether the model is actually paying — a 45%
 * win rate is fine at 3R and ruinous at 1R, and win rate alone can't tell
 * those apart.
 */
export interface Expectancy {
  /** Average R per closed trade. */
  perTrade: number;
  /** Same, in account currency, using each trade's own 1R. */
  perTradeCurrency: number;
  winRate: number;
  avgWinR: number;
  avgLossR: number;
  sampleSize: number;
}

export function getExpectancy(trades: Trade[]): Expectancy | null {
  const closed = trades.filter(isClosed);
  if (!closed.length) return null;

  const wins = closed.filter(isWin);
  const losses = closed.filter(isLoss);
  const avgWinR = wins.length
    ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length
    : 0;
  const avgLossR = losses.length
    ? losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length
    : 0;

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    perTrade: round(closed.reduce((s, t) => s + t.rMultiple, 0) / closed.length),
    perTradeCurrency: round(
      closed.reduce((s, t) => s + t.pnl, 0) / closed.length
    ),
    winRate: Math.round((wins.length / closed.length) * 1000) / 10,
    avgWinR: round(avgWinR),
    avgLossR: round(avgLossR),
    sampleSize: closed.length,
  };
}

/**
 * R outcomes bucketed for a histogram. With a fixed 1:3 target, a pile of
 * trades landing at +1R rather than +3R means targets are being cut early —
 * something average R alone hides.
 */
export interface RBucket {
  label: string;
  count: number;
  kind: "loss" | "win";
}

export function getRDistribution(trades: Trade[]): RBucket[] {
  const buckets: RBucket[] = [
    { label: "≤ -2R", count: 0, kind: "loss" },
    { label: "-2 to -1R", count: 0, kind: "loss" },
    { label: "-1 to 0R", count: 0, kind: "loss" },
    { label: "0 to 1R", count: 0, kind: "win" },
    { label: "1 to 2R", count: 0, kind: "win" },
    { label: "2 to 3R", count: 0, kind: "win" },
    { label: "3R+", count: 0, kind: "win" },
  ];

  for (const t of trades.filter(isClosed)) {
    const r = t.rMultiple;
    const i =
      r <= -2 ? 0
      : r <= -1 ? 1
      : r < 0 ? 2
      : r < 1 ? 3
      : r < 2 ? 4
      : r < 3 ? 5
      : 6;
    buckets[i].count += 1;
  }

  return buckets;
}
