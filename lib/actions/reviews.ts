"use server";

import { revalidatePath } from "next/cache";
import { deleteReview, upsertReview } from "@/lib/data/reviews";
import type { ReviewFormState } from "@/lib/actions/state";
import type { ReviewKind } from "@/lib/types";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveReview(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const date = str(formData, "date");
  const kind = str(formData, "kind") as ReviewKind;

  if (!date) return { error: "Pick a date.", savedAt: null };
  if (kind !== "pre" && kind !== "post") {
    return { error: "Unknown review type.", savedAt: null };
  }

  const ratingRaw = str(formData, "disciplineRating");
  const rating = ratingRaw ? Number(ratingRaw) : null;

  try {
    await upsertReview({
      date,
      kind,
      bias: str(formData, "bias"),
      // Comma-separated in the form; stored as an array.
      watchlist: str(formData, "watchlist")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      keyLevels: str(formData, "keyLevels"),
      newsEvents: str(formData, "newsEvents"),
      plan: str(formData, "plan"),
      mentalState: str(formData, "mentalState"),
      riskPlan: str(formData, "riskPlan"),
      followedPlan: str(formData, "followedPlan"),
      whatWentWell: str(formData, "whatWentWell"),
      whatWentWrong: str(formData, "whatWentWrong"),
      lessons: str(formData, "lessons"),
      disciplineRating:
        rating !== null && Number.isFinite(rating) ? rating : null,
      notes: str(formData, "notes"),
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save.",
      savedAt: null,
    };
  }

  revalidatePath("/reviews");
  return { error: null, savedAt: Date.now() };
}

export async function deleteReviewAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteReview(id);
  revalidatePath("/reviews");
}
