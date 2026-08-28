import { Sunrise, Sunset, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ReviewForm } from "@/components/review-form";
import { Badge } from "@/components/badge";
import { getReviews, getReviewFor } from "@/lib/data/reviews";
import { deleteReviewAction } from "@/lib/actions/reviews";
import { formatDate } from "@/lib/utils";
import type { MarketReview } from "@/lib/types";

export const metadata = { title: "Market Reviews — TradeLog" };

export default async function ReviewsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [preToday, postToday, history] = await Promise.all([
    getReviewFor(today, "pre"),
    getReviewFor(today, "post"),
    getReviews(),
  ]);

  // Today's entries already have dedicated forms above the history list.
  const past = history.filter((r) => r.date !== today);

  return (
    <>
      <PageHeader
        title="Market Reviews"
        description="Plan the session before it opens, review it once it closes."
      />

      <div className="page">
        <div className="grid-dense grid-cols-1 xl:grid-cols-2">
          <ReviewForm kind="pre" date={today} existing={preToday} />
          <ReviewForm kind="post" date={today} existing={postToday} />
        </div>

        <section aria-labelledby="history-heading">
          <h2
            id="history-heading"
            className="mb-3 font-display text-[13px] font-bold tracking-tight text-foreground"
          >
            Past reviews
          </h2>

          {past.length === 0 ? (
            <p className="card border-dashed p-6 text-center text-sm text-muted-foreground">
              Saved plans and reviews from other days will collect here.
            </p>
          ) : (
            <div className="space-y-3">
              {past.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ReviewCard({ review }: { review: MarketReview }) {
  const isPre = review.kind === "pre";
  const Icon = isPre ? Sunrise : Sunset;

  const rows: [string, string][] = isPre
    ? [
        ["Key levels", review.keyLevels],
        ["News & events", review.newsEvents],
        ["Plan", review.plan],
        ["Risk plan", review.riskPlan],
        ["Mental state", review.mentalState],
      ]
    : [
        ["What went well", review.whatWentWell],
        ["What went wrong", review.whatWentWrong],
        ["Lessons", review.lessons],
      ];

  const filled = rows.filter(([, v]) => v);

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(review.date)}
            </p>
            <p className="text-xs text-faint">
              {isPre ? "Pre-market plan" : "Post-market review"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {review.bias ? (
            <Badge tone={review.bias === "Bullish" ? "profit" : review.bias === "Bearish" ? "loss" : "neutral"}>
              {review.bias}
            </Badge>
          ) : null}
          {review.followedPlan ? (
            <Badge tone={review.followedPlan === "Yes" ? "profit" : review.followedPlan === "No" ? "loss" : "neutral"}>
              Plan: {review.followedPlan}
            </Badge>
          ) : null}
          {review.disciplineRating !== null ? (
            <Badge tone="accent">{review.disciplineRating}/10 discipline</Badge>
          ) : null}
          <form action={deleteReviewAction}>
            <input type="hidden" name="id" value={review.id} />
            <button
              type="submit"
              aria-label={`Delete ${isPre ? "plan" : "review"} for ${review.date}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-loss/10 hover:text-loss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      {review.watchlist.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.watchlist.map((s) => (
            <Badge key={s} tone="neutral">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}

      {filled.length ? (
        <dl className="mt-4 space-y-3 border-t border-border pt-4">
          {filled.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-faint">{label}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {review.notes ? (
        <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm italic text-muted-foreground">
          {review.notes}
        </p>
      ) : null}
    </article>
  );
}
