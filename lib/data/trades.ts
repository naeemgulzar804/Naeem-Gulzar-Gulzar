import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
  EntryExecution,
  SmtPair,
  SmtQuality,
  SweepQuality,
  Trade,
  TradeGrade,
  TradeResult,
  TradeSide,
} from "@/lib/types";

type TradeRow = Database["public"]["Tables"]["trades"]["Row"];

function mapTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    date: row.date,
    symbol: row.symbol,
    side: row.side,
    playbook: row.playbook ?? "",
    grade: row.grade ?? "B",
    result: row.result ?? (row.pnl >= 0 ? "Win" : "Loss"),

    day: new Date(`${row.date}T00:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }),
    session: row.session ?? "",
    timeframe: row.timeframe ?? "",
    dailyBias: row.daily_bias ?? "",
    marketCondition: row.market_condition ?? "",
    h4Candle: row.h4_candle ?? "",
    liquidityPurge: row.liquidity_purge,
    entryModel: row.entry_model ?? "",
    entryTime: row.entry_time ?? "",

    dailyAligned: row.daily_aligned,
    smtQuality: row.smt_quality ?? "",
    smtPair: row.smt_pair ?? "",
    sweepQuality: row.sweep_quality ?? "",
    entryExecution: row.entry_execution ?? "",

    entryPrice: row.entry_price ?? 0,
    exitPrice: row.exit_price ?? 0,
    stopLoss: row.stop_loss ?? 0,
    takeProfit: row.take_profit ?? 0,
    plannedRR: row.planned_rr ?? 0,
    size: row.size ?? 0,
    riskAmount: row.risk_amount ?? 0,
    riskPct: row.risk_pct ?? 0,
    rMultiple:
      row.r_multiple ?? (row.risk_amount ? row.pnl / row.risk_amount : 0),
    pnl: row.pnl,
    durationMinutes: row.duration_minutes ?? 0,

    confluences: row.confluences ?? [],

    emotionBefore: row.emotion_before ?? "",
    emotionDuring: row.emotion_during ?? "",
    emotionAfter: row.emotion_after ?? "",
    confidence: row.confidence,

    entryReason: row.entry_reason ?? "",
    exitReason: row.exit_reason ?? "",
    mistakes: row.mistakes ?? "",
    lessons: row.lessons ?? "",
    notes: row.notes ?? "",
    tags: row.tags ?? [],

    screenshotDailyPath: row.screenshot_daily_path,
    screenshotH4Path: row.screenshot_h4_path,
    screenshot15mPath: row.screenshot_15m_path,
  };
}

export async function getTrades(): Promise<Trade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTrade);
}

export async function getTrade(id: string): Promise<Trade | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTrade(data) : null;
}

export interface TradeInput {
  date: string;
  symbol: string;
  side: TradeSide;
  playbook: string;
  grade: TradeGrade;
  result: TradeResult;

  session: string;
  timeframe: string;
  dailyBias: string;
  marketCondition: string;
  h4Candle: string;
  liquidityPurge: boolean | null;
  entryModel: string;
  entryTime: string;

  dailyAligned: boolean | null;
  smtQuality: SmtQuality | "";
  smtPair: SmtPair | "";
  sweepQuality: SweepQuality | "";
  entryExecution: EntryExecution | "";

  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  plannedRR: number;
  size: number;
  riskAmount: number;
  riskPct: number;
  rMultiple: number;
  pnl: number;
  durationMinutes: number;

  confluences: string[];

  emotionBefore: string;
  emotionDuring: string;
  emotionAfter: string;
  confidence: number | null;

  entryReason: string;
  exitReason: string;
  mistakes: string;
  lessons: string;
  notes: string;

  screenshotDailyPath: string | null;
  screenshotH4Path: string | null;
  screenshot15mPath: string | null;
}

function toRow(input: TradeInput) {
  return {
    date: input.date,
    symbol: input.symbol,
    side: input.side,
    playbook: input.playbook || null,
    grade: input.grade,
    result: input.result,

    session: input.session || null,
    timeframe: input.timeframe || null,
    daily_bias: input.dailyBias || null,
    market_condition: input.marketCondition || null,
    h4_candle: input.h4Candle || null,
    liquidity_purge: input.liquidityPurge,
    entry_model: input.entryModel || null,
    entry_time: input.entryTime || null,

    daily_aligned: input.dailyAligned,
    smt_quality: input.smtQuality || null,
    smt_pair: input.smtPair || null,
    sweep_quality: input.sweepQuality || null,
    entry_execution: input.entryExecution || null,

    entry_price: input.entryPrice || null,
    exit_price: input.exitPrice || null,
    stop_loss: input.stopLoss || null,
    take_profit: input.takeProfit || null,
    planned_rr: input.plannedRR || null,
    size: input.size || null,
    risk_amount: input.riskAmount || null,
    risk_pct: input.riskPct || null,
    r_multiple: input.rMultiple,
    pnl: input.pnl,
    duration_minutes: input.durationMinutes || null,

    confluences: input.confluences,

    emotion_before: input.emotionBefore || null,
    emotion_during: input.emotionDuring || null,
    emotion_after: input.emotionAfter || null,
    confidence: input.confidence,

    entry_reason: input.entryReason || null,
    exit_reason: input.exitReason || null,
    mistakes: input.mistakes || null,
    lessons: input.lessons || null,
    notes: input.notes,
    tags: input.playbook ? [input.playbook] : [],

    screenshot_daily_path: input.screenshotDailyPath,
    screenshot_h4_path: input.screenshotH4Path,
    screenshot_15m_path: input.screenshot15mPath,
  };
}

export async function createTrade(input: TradeInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("trades")
    .insert({ user_id: user.id, ...toRow(input) });

  if (error) throw error;
}

export async function updateTrade(id: string, input: TradeInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("trades").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteTrade(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw error;
}

// Screenshots live in a private bucket, so the browser needs short-lived
// signed URLs to render them.
export async function signScreenshotUrls(
  paths: (string | null)[]
): Promise<(string | null)[]> {
  const present = paths.filter((p): p is string => Boolean(p));
  if (present.length === 0) return paths.map(() => null);

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("trade-screenshots")
    .createSignedUrls(present, 60 * 60);

  if (error) return paths.map(() => null);

  const byPath = new Map(
    (data ?? []).map((d) => [d.path, d.signedUrl as string | null])
  );
  return paths.map((p) => (p ? byPath.get(p) ?? null : null));
}
