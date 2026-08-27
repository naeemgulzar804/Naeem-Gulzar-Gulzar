import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { JournalEntry } from "@/lib/types";

type JournalRow = Database["public"]["Tables"]["journal_entries"]["Row"];

function mapJournalEntry(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    mood: row.mood ?? "neutral",
    content: row.content ?? "",
    linkedTradeIds: row.linked_trade_ids ?? [],
  };
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapJournalEntry);
}

export interface NewJournalEntryInput {
  date: string;
  title: string;
  mood: "confident" | "neutral" | "frustrated" | "disciplined";
  content: string;
  /** Trades this reflection is about, so the entry links back to them. */
  linkedTradeIds?: string[];
}

export async function createJournalEntry(input: NewJournalEntryInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id,
    date: input.date,
    title: input.title,
    mood: input.mood,
    content: input.content,
    linked_trade_ids: input.linkedTradeIds ?? [],
  });

  if (error) throw error;
}
