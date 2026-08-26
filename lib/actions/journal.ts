"use server";

import { revalidatePath } from "next/cache";
import { createJournalEntry } from "@/lib/data/journal";
import type { JournalFormState } from "@/lib/actions/state";

export async function addJournalEntry(
  _prevState: JournalFormState,
  formData: FormData
): Promise<JournalFormState> {
  const date = String(formData.get("date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const mood = String(formData.get("mood") ?? "neutral") as
    | "confident"
    | "neutral"
    | "frustrated"
    | "disciplined";
  const content = String(formData.get("content") ?? "").trim();

  if (!date || !title) {
    return { error: "Date and title are required." };
  }

  try {
    await createJournalEntry({ date, title, mood, content });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save entry." };
  }

  revalidatePath("/journal");
  return { error: null };
}
