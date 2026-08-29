import { createClient } from "@/lib/supabase/server";
import type { PropEvent, PropEventKind } from "@/lib/types";

type Row = {
  id: string;
  account_id: string | null;
  account_label: string | null;
  kind: PropEventKind;
  amount: number;
  occurred_on: string;
  note: string | null;
};

function mapEvent(row: Row): PropEvent {
  return {
    id: row.id,
    accountId: row.account_id,
    accountLabel: row.account_label ?? "",
    kind: row.kind,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    note: row.note ?? "",
  };
}

/**
 * The payout / cut ledger, newest first. Returns empty rather than throwing
 * when the table doesn't exist yet, so an un-migrated database still renders
 * the page — the guidance simply has no history to reason from.
 */
export async function getPropEvents(limit = 400): Promise<PropEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prop_events")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Row[]).map(mapEvent);
}

export async function addPropEvent(event: {
  accountId: string | null;
  accountLabel: string;
  kind: PropEventKind;
  amount: number;
  occurredOn: string;
  note: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("prop_events").insert({
    user_id: user.id,
    account_id: event.accountId,
    account_label: event.accountLabel || null,
    kind: event.kind,
    amount: event.amount,
    occurred_on: event.occurredOn,
    note: event.note || null,
  });
  if (error) throw error;
}

export async function deletePropEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prop_events").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Moves an account to the next phase. Phase 1 → Phase 2 → funded, which is
 * also T3 → T2 → T1: promotion and tier change are the same event.
 */
export async function promoteAccount(id: string, phase: "phase2" | "funded") {
  const supabase = await createClient();
  // A newly funded account starts its own cycle from the day it is promoted,
  // which is what keeps the staggering honest.
  const patch =
    phase === "funded"
      ? { phase, cycle_start: new Date().toISOString().slice(0, 10) }
      : { phase };
  const { error } = await supabase.from("accounts").update(patch).eq("id", id);
  if (error) throw error;
}
