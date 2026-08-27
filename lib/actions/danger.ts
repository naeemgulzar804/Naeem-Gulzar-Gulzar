"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DangerState } from "@/lib/actions/state";

const CONFIRM_PHRASE = "DELETE";

/**
 * Wipes every trade for the signed-in user, plus their uploaded chart
 * screenshots so the storage bucket doesn't accumulate orphans. Requires the
 * user to type a confirmation phrase — this is irreversible.
 */
export async function deleteAllTrades(
  _prev: DangerState,
  formData: FormData
): Promise<DangerState> {
  const typed = String(formData.get("confirm") ?? "").trim();
  if (typed !== CONFIRM_PHRASE) {
    return {
      error: `Type ${CONFIRM_PHRASE} exactly to confirm.`,
      deleted: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated.", deleted: null };

  // Read the screenshot paths before the rows go, or they become unreachable.
  const { data: rows, error: readError } = await supabase
    .from("trades")
    .select("screenshot_daily_path, screenshot_h4_path, screenshot_15m_path");

  if (readError) return { error: readError.message, deleted: null };

  const count = rows?.length ?? 0;
  if (count === 0) {
    return { error: "There are no trades to delete.", deleted: null };
  }

  const paths = (rows ?? [])
    .flatMap((r) => [
      r.screenshot_daily_path,
      r.screenshot_h4_path,
      r.screenshot_15m_path,
    ])
    .filter((p): p is string => Boolean(p));

  if (paths.length) {
    // Best effort: a storage hiccup shouldn't block deleting the trades.
    await supabase.storage.from("trade-screenshots").remove(paths);
  }

  const { error: deleteError } = await supabase
    .from("trades")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) return { error: deleteError.message, deleted: null };

  revalidatePath("/", "layout");
  return { error: null, deleted: count };
}
