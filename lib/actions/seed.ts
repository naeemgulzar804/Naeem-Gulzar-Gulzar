"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TRADES, JOURNAL_ENTRIES } from "@/lib/mock-data";

// Populates a fresh account with the same realistic demo trades and journal
// entries used before real persistence existed, so a new user isn't staring
// at an empty dashboard. Playbooks are already seeded per-user by the
// on_auth_user_created_seed_playbooks DB trigger.
export async function seedDemoData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const tradeRows = TRADES.map((t) => ({
    user_id: user.id,
    date: t.date,
    symbol: t.symbol,
    side: t.side,
    playbook: t.playbook,
    grade: t.grade,
    result: t.result,

    session: t.session,
    timeframe: t.timeframe,
    daily_bias: t.dailyBias,
    market_condition: t.marketCondition,
    h4_candle: t.h4Candle,
    liquidity_purge: t.liquidityPurge,
    entry_model: t.entryModel,
    entry_time: t.entryTime,

    daily_aligned: t.dailyAligned,
    smt_quality: t.smtQuality || null,
    smt_pair: t.smtPair || null,
    sweep_quality: t.sweepQuality || null,
    entry_execution: t.entryExecution || null,

    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    stop_loss: t.stopLoss,
    take_profit: t.takeProfit,
    planned_rr: t.plannedRR,
    size: t.size,
    risk_amount: t.riskAmount,
    risk_pct: t.riskPct,
    r_multiple: t.rMultiple,
    pnl: t.pnl,
    duration_minutes: t.durationMinutes,

    confluences: t.confluences,

    emotion_before: t.emotionBefore,
    emotion_during: t.emotionDuring,
    emotion_after: t.emotionAfter,
    confidence: t.confidence,

    entry_reason: t.entryReason,
    exit_reason: t.exitReason,
    mistakes: t.mistakes,
    lessons: t.lessons,
    notes: t.notes,
    tags: t.tags,
  }));

  const journalRows = JOURNAL_ENTRIES.map((j) => ({
    user_id: user.id,
    date: j.date,
    title: j.title,
    mood: j.mood,
    content: j.content,
  }));

  const { error: tradesError } = await supabase.from("trades").insert(tradeRows);
  if (tradesError) throw tradesError;

  const { error: journalError } = await supabase
    .from("journal_entries")
    .insert(journalRows);
  if (journalError) throw journalError;

  revalidatePath("/", "layout");
}
