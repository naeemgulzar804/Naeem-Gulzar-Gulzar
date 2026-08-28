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

/*
 * The model's kill zones: the 1/5/9 AM New York H4 candle opens, and nothing
 * else. An earlier version of this journal offered 3/6/9 AM instead, so trades
 * logged before that fix carry those values; they stay readable everywhere but
 * are not offered for new trades and do not count as kill-zone entries.
 */
export const ENTRY_TIMES = ["1 AM", "5 AM", "9 AM"] as const;

export const SMT_QUALITIES = ["Clear", "Borderline", "Forced", "None"] as const;
export const SMT_PAIRS = ["GBPUSD", "DXY", "Both", "None"] as const;
export const SWEEP_QUALITIES = ["Clean", "Borderline", "None"] as const;
export const ENTRY_EXECUTIONS = [
  "OB retest",
  "Early — engulfing candle",
  "Late — chased after retest",
  "Other",
] as const;

export type SmtQuality = (typeof SMT_QUALITIES)[number];
export type SmtPair = (typeof SMT_PAIRS)[number];
export type SweepQuality = (typeof SWEEP_QUALITIES)[number];
export type EntryExecution = (typeof ENTRY_EXECUTIONS)[number];

/** True when the trade was entered at one of the model's kill zones. */
export function isKillZone(entryTime: string) {
  return (ENTRY_TIMES as readonly string[]).includes(entryTime);
}

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
  /** Null on trades logged before accounts existed. */
  accountId: string | null;
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

  // The three A+ criteria, plus how the entry was actually executed.
  // Null/"" means the trade predates these fields, not that the answer is no.
  dailyAligned: boolean | null;
  smtQuality: SmtQuality | "";
  smtPair: SmtPair | "";
  sweepQuality: SweepQuality | "";
  entryExecution: EntryExecution | "";

  // Execution & risk
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  plannedRR: number;

  /**
   * Worst and best price the trade reached while open (MAE / MFE). Stored as
   * prices because that is what you read off a chart; R is derived. Zero
   * means not recorded — the same convention the other price fields use.
   */
  maePrice: number;
  mfePrice: number;

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

export interface Account extends AccountSettings {
  id: string;
  name: string;
}

export interface AccountSettings {
  startingBalance: number;
  /** Null means the limit is not enforced. */
  dailyLossLimit: number | null;
  maxDrawdown: number | null;
  profitTarget: number | null;
  maxLossesPerDay: number;
  /** Risk when Daily TF agrees with the H4 direction, and when it doesn't. */
  riskPctAligned: number;
  riskPctUnaligned: number;
}

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  startingBalance: 50000,
  dailyLossLimit: null,
  maxDrawdown: null,
  profitTarget: null,
  maxLossesPerDay: 2,
  riskPctAligned: 1,
  riskPctUnaligned: 0.5,
};

export interface GroupWinRate {
  rate: number;
  count: number;
  wins: number;
}

export type ReviewKind = "pre" | "post";
export type MarketBias = "Bullish" | "Bearish" | "Neutral";
export type PlanAdherence = "Yes" | "Partially" | "No";

export const MARKET_BIASES: MarketBias[] = ["Bullish", "Bearish", "Neutral"];
export const PLAN_ADHERENCE: PlanAdherence[] = ["Yes", "Partially", "No"];

/** A pre-market plan or a post-market review for one trading day. */
export interface MarketReview {
  id: string;
  date: string;
  kind: ReviewKind;

  // Pre-market
  bias: MarketBias | null;
  watchlist: string[];
  keyLevels: string;
  newsEvents: string;
  plan: string;
  mentalState: string;
  riskPlan: string;

  // Post-market
  followedPlan: PlanAdherence | null;
  whatWentWell: string;
  whatWentWrong: string;
  lessons: string;
  disciplineRating: number | null;

  notes: string;
  updatedAt: string;
}

/** One surfaced edge or leak found in the trade history. */
export interface TradePattern {
  id: string;
  title: string;
  detail: string;
  kind: "edge" | "leak" | "neutral";
  /** Win rate of the subset, in percent. */
  rate: number;
  /** Percentage points above/below the overall baseline. */
  lift: number;
  sampleSize: number;
  /**
   * For provisional patterns only: roughly how many more trades in this
   * group it would take to confirm the gap, if the rate held.
   */
  moreTradesNeeded?: number;
}
