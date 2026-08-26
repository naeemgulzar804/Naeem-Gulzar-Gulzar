import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { Trade } from "@/lib/types";

type TradeRow = Database["public"]["Tables"]["trades"]["Row"];

function mapTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    date: row.date,
    symbol: row.symbol,
    side: row.side,
    playbook: row.playbook ?? "Other",
    grade: row.grade ?? "B",
    entryPrice: row.entry_price ?? 0,
    exitPrice: row.exit_price ?? 0,
    size: row.size ?? 0,
    riskAmount: row.risk_amount ?? 0,
    rMultiple: row.r_multiple ?? (row.risk_amount ? row.pnl / row.risk_amount : 0),
    pnl: row.pnl,
    durationMinutes: row.duration_minutes ?? 0,
    tags: row.tags ?? [],
    notes: row.notes ?? "",
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

export interface NewTradeInput {
  date: string;
  symbol: string;
  side: "long" | "short";
  playbook: string;
  grade: "A+" | "B";
  entryPrice: number;
  exitPrice: number;
  size: number;
  riskAmount: number;
  rMultiple: number;
  pnl: number;
  durationMinutes: number;
  notes: string;
}

export async function createTrade(input: NewTradeInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    date: input.date,
    symbol: input.symbol,
    side: input.side,
    playbook: input.playbook,
    grade: input.grade,
    entry_price: input.entryPrice,
    exit_price: input.exitPrice,
    size: input.size,
    risk_amount: input.riskAmount,
    r_multiple: input.rMultiple,
    pnl: input.pnl,
    duration_minutes: input.durationMinutes,
    tags: [input.playbook],
    notes: input.notes,
  });

  if (error) throw error;
}

export async function deleteTrade(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw error;
}
