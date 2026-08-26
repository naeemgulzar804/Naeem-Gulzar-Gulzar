"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTrade, deleteTrade } from "@/lib/data/trades";
import type { TradeFormState } from "@/lib/actions/state";

function num(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

export async function addTrade(
  _prevState: TradeFormState,
  formData: FormData
): Promise<TradeFormState> {
  const date = String(formData.get("date") ?? "");
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  const side = String(formData.get("side") ?? "long") as "long" | "short";
  const playbook = String(formData.get("playbook") ?? "").trim();
  const grade = String(formData.get("grade") ?? "B") as "A+" | "B";
  const entryPrice = num(formData, "entryPrice");
  const exitPrice = num(formData, "exitPrice");
  const size = num(formData, "size");
  const riskAmount = num(formData, "riskAmount");
  const pnl = num(formData, "pnl");
  const durationMinutes = num(formData, "durationMinutes");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !symbol || !playbook) {
    return { error: "Date, symbol, and playbook are required." };
  }

  const rMultiple = riskAmount > 0 ? Math.round((pnl / riskAmount) * 100) / 100 : 0;

  try {
    await createTrade({
      date,
      symbol,
      side,
      playbook,
      grade,
      entryPrice,
      exitPrice,
      size,
      riskAmount,
      rMultiple,
      pnl,
      durationMinutes,
      notes,
    });
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
