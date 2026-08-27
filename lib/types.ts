export type TradeSide = "long" | "short";
export type TradeGrade = "A+" | "A" | "B" | "C";
export type TradeResult = "Win" | "Loss" | "Break Even";
export type DailyBias = "Bullish" | "Bearish";
export type MarketCondition = "Balanced" | "Imbalanced";

export const PAIRS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "XAUUSD",
  "GBPJPY",
  "AUDUSD",
  "USDCHF",
  "USDCAD",
  "NAS100",
  "US30",
  "EURJPY",
  "GBPAUD",
  "NZDUSD",
  "EURGBP",
] as const;

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const SESSIONS = [
  "London",
  "New York",
  "Asian",
  "London/NY Overlap",
] as const;

export const STRATEGIES = [
  "ICT OB",
  "ICT FVG",
  "SMC Liquidity",
  "Rejection Block",
  "Dealing Range",
  "Breaker Block",
  "Custom",
] as const;

export const SETUP_GRADES: TradeGrade[] = ["A+", "A", "B", "C"];
export const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "Daily"] as const;
export const H4_CANDLES = ["1 AM", "5 AM", "9 AM"] as const;
export const ENTRY_TIMES = ["3 AM", "6 AM", "9 AM"] as const;

export const ENTRY_MODELS = [
  "Bullish OB",
  "Bearish OB",
  "Bullish FVG",
  "Bearish FVG",
  "Rejection",
  "Sweep",
] as const;

export const CONFLUENCES = [
  "H4 OB",
  "FVG",
  "Premium Zone",
  "Discount Zone",
  "Liquidity Sweep",
  "Rejection Block",
  "Old High/Low",
  "H4 Imbalance",
  "Daily OB",
  "MSB",
  "BOS",
] as const;

export const EMOTIONS = [
  "Calm",
  "Confident",
  "Focused",
  "Anxious",
  "FOMO",
  "Greedy",
  "Fearful",
  "Neutral",
  "Excited",
  "Uncertain",
  "Impatient",
  "Disciplined",
] as const;

export interface Trade {
  id: string;
  date: string; // ISO date, entry day
  symbol: string;
  side: TradeSide;
  playbook: string;
  grade: TradeGrade;
  result: TradeResult;

  // Market context
  day: string;
  session: string;
  timeframe: string;
  dailyBias: string;
  marketCondition: string;
  h4Candle: string;
  liquidityPurge: boolean | null;
  entryModel: string;
  entryTime: string;

  // Execution & risk
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  plannedRR: number;
  size: number; // lots
  riskAmount: number; // $ risked (1R)
  riskPct: number;
  rMultiple: number; // realized R
  pnl: number; // $
  durationMinutes: number;

  confluences: string[];

  // Psychology
  emotionBefore: string;
  emotionDuring: string;
  emotionAfter: string;
  confidence: number | null;

  // Review
  entryReason: string;
  exitReason: string;
  mistakes: string;
  lessons: string;
  notes: string;
  tags: string[];

  // Chart screenshots (Supabase Storage object paths)
  screenshotDailyPath: string | null;
  screenshotH4Path: string | null;
  screenshot15mPath: string | null;
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

export interface GroupWinRate {
  rate: number;
  count: number;
  wins: number;
}
