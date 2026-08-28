"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTrade, deleteTrade, updateTrade, type TradeInput } from "@/lib/data/trades";
import type { TradeFormState } from "@/lib/actions/state";
import type {
  EntryExecution,
  SmtPair,
  SmtQuality,
  SweepQuality,
  TradeGrade,
  TradeResult,
  TradeSide,
} from "@/lib/types";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? v : 0;
}

export async function saveTrade(
  _prevState: TradeFormState,
  formData: FormData
): Promise<TradeFormState> {
  const id = str(formData, "id");
  const symbol = str(formData, "symbol").toUpperCase();
  const date = str(formData, "date");
  const result = str(formData, "result") as TradeResult | "";

  if (!symbol || !date || !result) {
    return { error: "Pair, date, and result are required." };
  }

  const direction = str(formData, "side");
  const purge = str(formData, "liquidityPurge");
  const aligned = str(formData, "dailyAligned");
  const confidence = num(formData, "confidence");
  const confluences = str(formData, "confluences")
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);

  const input: TradeInput = {
    date,
    symbol,
    side: (direction === "Short" ? "short" : "long") as TradeSide,
    playbook: str(formData, "playbook"),
    grade: (str(formData, "grade") || "B") as TradeGrade,
    result,
    accountId: str(formData, "accountId") || null,

    session: str(formData, "session"),
    timeframe: str(formData, "timeframe"),
    dailyBias: str(formData, "dailyBias"),
    marketCondition: str(formData, "marketCondition"),
    h4Candle: str(formData, "h4Candle"),
    liquidityPurge: purge === "Yes" ? true : purge === "No" ? false : null,
    entryModel: str(formData, "entryModel"),
    entryTime: str(formData, "entryTime"),

    dailyAligned: aligned === "Yes" ? true : aligned === "No" ? false : null,
    smtQuality: str(formData, "smtQuality") as SmtQuality | "",
    smtPair: str(formData, "smtPair") as SmtPair | "",
    sweepQuality: str(formData, "sweepQuality") as SweepQuality | "",
    entryExecution: str(formData, "entryExecution") as EntryExecution | "",

    entryPrice: num(formData, "entryPrice"),
    exitPrice: num(formData, "exitPrice"),
    stopLoss: num(formData, "stopLoss"),
    takeProfit: num(formData, "takeProfit"),
    plannedRR: num(formData, "plannedRR"),
    maePrice: num(formData, "maePrice"),
    mfePrice: num(formData, "mfePrice"),
    size: num(formData, "size"),
    riskAmount: num(formData, "riskAmount"),
    riskPct: num(formData, "riskPct"),
    rMultiple: num(formData, "rMultiple"),
    pnl: num(formData, "pnl"),
    durationMinutes: num(formData, "durationMinutes"),

    confluences,

    emotionBefore: str(formData, "emotionBefore"),
    emotionDuring: str(formData, "emotionDuring"),
    emotionAfter: str(formData, "emotionAfter"),
    confidence: confidence >= 1 && confidence <= 10 ? confidence : null,

    entryReason: str(formData, "entryReason"),
    exitReason: str(formData, "exitReason"),
    mistakes: str(formData, "mistakes"),
    lessons: str(formData, "lessons"),
    notes: str(formData, "notes"),

    screenshotDailyPath: str(formData, "screenshotDailyPath") || null,
    screenshotH4Path: str(formData, "screenshotH4Path") || null,
    screenshot15mPath: str(formData, "screenshot15mPath") || null,
  };

  try {
    if (id) await updateTrade(id, input);
    else await createTrade(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save trade." };
  }

  revalidatePath("/", "layout");
  redirect("/trades");
}

export async function deleteTradeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTrade(id);
  revalidatePath("/", "layout");
}
