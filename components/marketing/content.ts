/*
 * Marketing copy kept out of the page so it is editable without touching
 * layout.
 *
 * ⚠️ PLACEHOLDERS — REPLACE BEFORE LAUNCH
 *
 * `TESTIMONIALS` are written examples, not real customers. Publishing invented
 * quotes as genuine is a misrepresentation, so swap in real ones (with
 * permission) or delete the section before this page goes live.
 *
 * `PLANS` prices are illustrative. Set your real tiers before taking payment.
 *
 * The quotes deliberately describe using the product, never returns or profit.
 * Testimonials implying financial results carry advertising obligations in most
 * jurisdictions, and this is a journaling tool, not a signal service — keep any
 * replacements on the same side of that line.
 */

export interface Testimonial {
  /** Stable key — the placeholder names are not unique. */
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "setups",
    quote:
      "I had four months of trades in a spreadsheet and no idea which of my setups were carrying the account. Two weeks in here and the answer was uncomfortable but obvious.",
    name: "Placeholder name",
    role: "Futures, 2 years",
    initials: "PN",
  },
  {
    id: "grading",
    quote:
      "The grading is what changed it for me. Scoring the setup before I know the outcome stopped me from calling a lucky win a good trade.",
    name: "Placeholder name",
    role: "FX, funded account",
    initials: "PN",
  },
  {
    id: "psychology",
    quote:
      "The psychology log sounded like fluff until it showed me every rule I break happens in the same hour of the session.",
    name: "Placeholder name",
    role: "Indices, part-time",
    initials: "PN",
  },
];

export interface Plan {
  name: string;
  tagline: string;
  price: string;
  period?: string;
  cta: string;
  featured?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "Enough to know if it helps.",
    price: "$0",
    period: "/month",
    cta: "Start free",
    features: [
      "Up to 50 trades",
      "Calendar and equity curve",
      "Basic win-rate analytics",
      "One account",
    ],
  },
  {
    name: "Pro",
    tagline: "The full journal.",
    price: "$19",
    period: "/month",
    cta: "Start free trial",
    featured: true,
    features: [
      "Unlimited trades",
      "Setup grading and confluence analytics",
      "Psychology and discipline tracking",
      "Account score and drawdown monitoring",
      "AI coach reviews",
      "CSV export",
    ],
  },
  {
    name: "Funded",
    tagline: "For multiple prop accounts.",
    price: "$39",
    period: "/month",
    cta: "Start free trial",
    features: [
      "Everything in Pro",
      "Unlimited accounts",
      "Per-account risk guardrails",
      "Daily loss and drawdown limits",
      "Priority support",
    ],
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "Does it connect to my broker automatically?",
    a: "Not yet. Trades are logged manually or imported from CSV. Manual entry is deliberate for now — the grading and psychology fields are the point of this journal, and a broker sync cannot fill those in for you.",
  },
  {
    q: "Is my trading data private?",
    a: "Your journal is yours. It is stored against your account and is not shared, sold, or used to train models. You can export everything to CSV at any time, and deleting your account removes the data.",
  },
  {
    q: "What happens to my trades if I downgrade or cancel?",
    a: "Nothing is deleted. You keep read access and full CSV export of your entire history on every plan, including Free. Downgrading only limits new logging, never access to what you already recorded.",
  },
  {
    q: "Will this work with my strategy?",
    a: "The confluence fields are built around a price-action model — sweeps, order blocks, imbalance, dealing range, session timing. If you trade something structurally different, the core journal, calendar, and analytics still apply, but some tagging fields will not map cleanly.",
  },
  {
    q: "Does the AI coach give trading advice?",
    a: "No. It reviews what you have already logged and reflects patterns back at you — rules broken, setups over-traded, grades that do not match results. It does not suggest entries, predict markets, or tell you what to trade.",
  },
  {
    q: "Can I use it for more than one prop account?",
    a: "Yes, on the Funded plan. Each account carries its own starting balance, daily loss limit, and drawdown ceiling, and every view can be filtered to one account or seen across all of them.",
  },
];
