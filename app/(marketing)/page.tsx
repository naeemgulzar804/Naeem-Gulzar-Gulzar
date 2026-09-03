import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  ClipboardList,
  Radar,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import { HeroBoard } from "@/components/marketing/hero-board";
import { PLANS, FAQS, TESTIMONIALS } from "@/components/marketing/content";

export const metadata: Metadata = {
  title: "TradeLog — A trading journal for people who treat it like a job",
  description:
    "Log every trade against your own model, then find out which parts of it actually make money. Calendar P&L, setup grading, psychology tracking, and an AI coach that reads your journal.",
};

const FEATURES = [
  {
    icon: CalendarDays,
    title: "The month, at a glance",
    body: "Every day coloured and valued by its P&L, with a weekly rail beside it — because a funded account is managed in weeks, not days. A bad Tuesday matters less than a bad week, and the calendar is the only view that shows you the difference.",
    points: ["Daily and weekly P&L", "Trade count and win rate per day", "Drill into any day"],
  },
  {
    icon: Radar,
    title: "Grade the setup, not the outcome",
    body: "Tag each trade with the confluences that were actually present — sweep quality, SMT, dealing range, entry model — and grade it A+ through C before you know the result. Then see which grades pay and which ones you only think pay.",
    points: ["Confluence-level win rates", "A+ vs B performance split", "Pattern discovery across setups"],
  },
  {
    icon: Brain,
    title: "The part most journals skip",
    body: "Revenge trades, oversized entries, and rules broken under tilt do not show up in a P&L column. Log your state alongside the trade and the discipline report shows what your psychology costs you in currency.",
    points: ["Rule-break tracking", "Risk guardrails and daily limits", "Drawdown and streak monitoring"],
  },
  {
    icon: Sparkles,
    title: "A coach that has read your journal",
    body: "Not a generic chatbot. It has your trades, your grades, your notes, and your rules, so the review it writes is about your model — including the parts you have been quietly avoiding.",
    points: ["Post-session reviews", "Loss post-mortems", "Model refinement prompts"],
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(closest-side,var(--color-accent-soft),transparent)]"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              Built around a real trading model
            </span>

            <h1 className="font-display mt-5 text-[34px] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[52px]">
              Your edge is in here.
              <br />
              <span className="text-accent">Most of it is not.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              TradeLog scores every trade against the model you actually run,
              then tells you which confluences pay, which ones you only believe
              in, and what your discipline costs in currency.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                Start journaling free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#features"
                className="flex min-h-12 w-full items-center justify-center rounded-lg border border-border-strong px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                See what it tracks
              </a>
            </div>

            <p className="mt-4 text-xs text-faint">
              No card required · Import or log manually · Cancel anytime
            </p>
          </div>

          <div className="mt-14">
            <HeroBoard />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section id="features" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              What it tracks
            </p>
            <h2 className="font-display mt-3 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[38px]">
              A journal that argues with you
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Logging trades is the easy part. The value is in what the log
              says back — and most journals never say anything.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body, points }) => (
              <article
                key={title}
                className="card flex flex-col transition-colors hover:border-border-strong"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
                <ul className="mt-4 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Social proof */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              From the desk
            </p>
            <h2 className="font-display mt-3 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[38px]">
              What traders say it changed
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.id} className="card flex flex-col justify-between">
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent"
                  >
                    {t.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Pricing */}
      <section id="pricing" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Pricing
            </p>
            <h2 className="font-display mt-3 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[38px]">
              One account, priced like a tool
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Billed monthly. Every plan keeps your full trade history — nothing
              is held hostage if you downgrade.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.featured
                    ? "card relative border-accent-border bg-accent-soft ring-1 ring-accent-border lg:-mt-4 lg:pb-8 lg:pt-8"
                    : "card"
                }
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-on-accent">
                    Most popular
                  </span>
                ) : null}

                <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

                <p className="mt-5 flex items-baseline gap-1">
                  <span className="figure text-[32px] font-bold leading-none text-foreground">
                    {plan.price}
                  </span>
                  {plan.period ? (
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  ) : null}
                </p>

                <Link
                  href="/signup"
                  className={
                    plan.featured
                      ? "mt-6 flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      : "mt-6 flex min-h-11 items-center justify-center rounded-lg border border-border-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  }
                >
                  {plan.cta}
                </Link>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[38px]">
            Questions
          </h2>

          <div className="mt-10 divide-y divide-border border-y border-border">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {faq.q}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Final CTA */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="card border-accent-border bg-accent-soft px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[34px]">
              The next 30 trades are going to happen anyway
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              You may as well know what they tell you.
            </p>
            <Link
              href="/signup"
              className="mx-auto mt-8 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Create your journal
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
