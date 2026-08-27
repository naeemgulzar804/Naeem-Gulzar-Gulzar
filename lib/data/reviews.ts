import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
  MarketBias,
  MarketReview,
  PlanAdherence,
  ReviewKind,
} from "@/lib/types";

type ReviewRow = Database["public"]["Tables"]["market_reviews"]["Row"];

function mapReview(row: ReviewRow): MarketReview {
  return {
    id: row.id,
    date: row.date,
    kind: row.kind,
    bias: (row.bias as MarketBias | null) ?? null,
    watchlist: row.watchlist ?? [],
    keyLevels: row.key_levels ?? "",
    newsEvents: row.news_events ?? "",
    plan: row.plan ?? "",
    mentalState: row.mental_state ?? "",
    riskPlan: row.risk_plan ?? "",
    followedPlan: (row.followed_plan as PlanAdherence | null) ?? null,
    whatWentWell: row.what_went_well ?? "",
    whatWentWrong: row.what_went_wrong ?? "",
    lessons: row.lessons ?? "",
    disciplineRating: row.discipline_rating,
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
  };
}

export async function getReviews(limit = 60): Promise<MarketReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_reviews")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapReview);
}

export async function getReviewFor(
  date: string,
  kind: ReviewKind
): Promise<MarketReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_reviews")
    .select("*")
    .eq("date", date)
    .eq("kind", kind)
    .maybeSingle();

  if (error) throw error;
  return data ? mapReview(data) : null;
}

export interface ReviewInput {
  date: string;
  kind: ReviewKind;
  bias: string;
  watchlist: string[];
  keyLevels: string;
  newsEvents: string;
  plan: string;
  mentalState: string;
  riskPlan: string;
  followedPlan: string;
  whatWentWell: string;
  whatWentWrong: string;
  lessons: string;
  disciplineRating: number | null;
  notes: string;
}

/**
 * One plan and one review per day, so saving the same day twice updates in
 * place rather than stacking duplicates.
 */
export async function upsertReview(input: ReviewInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("market_reviews").upsert(
    {
      user_id: user.id,
      date: input.date,
      kind: input.kind,
      bias: input.bias || null,
      watchlist: input.watchlist,
      key_levels: input.keyLevels || null,
      news_events: input.newsEvents || null,
      plan: input.plan || null,
      mental_state: input.mentalState || null,
      risk_plan: input.riskPlan || null,
      followed_plan: input.followedPlan || null,
      what_went_well: input.whatWentWell || null,
      what_went_wrong: input.whatWentWrong || null,
      lessons: input.lessons || null,
      discipline_rating: input.disciplineRating,
      notes: input.notes || null,
    },
    { onConflict: "user_id,date,kind" }
  );

  if (error) throw error;
}

export async function deleteReview(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("market_reviews").delete().eq("id", id);
  if (error) throw error;
}
