import type { DailyPnl, Stats, Trade } from "@/lib/types";

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
    if (t.pnl >= 0) existing.wins += 1;
    else existing.losses += 1;
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

  const wins = trades.filter((t) => t.pnl >= 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = Math.round((grossWin - grossLoss) * 100) / 100;
  const daily = getDailyPnl(trades);
  const bestDay = daily.reduce<DailyPnl | null>(
    (best, d) => (!best || d.pnl > best.pnl ? d : best),
    null
  );
  const worstDay = daily.reduce<DailyPnl | null>(
    (worst, d) => (!worst || d.pnl < worst.pnl ? d : worst),
    null
  );

  const byDateAsc = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak: Stats["currentStreak"] = { type: "win", count: 0 };
  for (let i = byDateAsc.length - 1; i >= 0; i--) {
    const isWin = byDateAsc[i].pnl >= 0;
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
    winRate: Math.round((wins.length / trades.length) * 1000) / 10,
    profitFactor: grossLoss === 0 ? grossWin : Math.round((grossWin / grossLoss) * 100) / 100,
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
