export type TradeSide = "long" | "short";
export type TradeGrade = "A+" | "B";

export interface Trade {
  id: string;
  date: string; // ISO date, entry day
  symbol: string;
  side: TradeSide;
  playbook: string;
  grade: TradeGrade;
  entryPrice: number;
  exitPrice: number;
  size: number; // lots
  riskAmount: number; // $ risked (1R)
  rMultiple: number; // realized R
  pnl: number; // $
  durationMinutes: number;
  tags: string[];
  notes: string;
}

export interface DailyPnl {
  date: string; // ISO date (YYYY-MM-DD)
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export interface Playbook {
  id: string;
  name: string;
  summary: string;
  rules: string[];
  tags: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  mood: "confident" | "neutral" | "frustrated" | "disciplined";
  content: string;
  linkedTradeIds: string[];
}

export interface Stats {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgR: number;
  bestDay: DailyPnl | null;
  worstDay: DailyPnl | null;
  totalTrades: number;
  currentStreak: { type: "win" | "loss"; count: number };
}
