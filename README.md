# TradeLog

A trading journal web app, inspired by TradeZella. Track trades, review performance, and refine your edge.

Built with Next.js (App Router) and Tailwind CSS. This first version is a static UI wired to mock data — no auth or persistence yet.

## Pages

- **Dashboard** (`/`) — net P&L, win rate, profit factor, equity curve, recent trades.
- **Trade Log** (`/trades`) — filterable table of every logged trade.
- **Calendar** (`/calendar`) — monthly heatmap of daily P&L.
- **Journal & Playbooks** (`/journal`) — saved strategy setups and daily reflections.
- **Prop Firm System** (`/prop-firm`) — the 3-Tier Framework applied to your accounts.

## Prop Firm System

Each account carries its firm, size, and phase (Phase 1 eval, Phase 2, or
funded), and everything else is derived:

- **Tier** — funded is T1, Phase 2 is T2, Phase 1 is T3.
- **Cut triggers** — −6% on a funded account, −4% in either evaluation phase,
  measured from the starting balance or the high-water mark depending on how
  the firm defines drawdown. Each account shows the dollars left before it
  fires.
- **Payout lock** — a funded account up +3% says so, in the action list.
- **Cycle** — 4 weeks on, 1 week off, anchored per account so the staggering
  is visible and collisions are flagged.
- **Tier ratios** — T2 must hold 60% of T1 and T3 40%, and the spend priority
  (restock T3 → restock T2 → expand T1 → personal income) reads off the gaps.
- **Scale-up gate, upgrade ladder, reinvestment stage** — computed from the
  payout/cut ledger and the last 20 logged trades.
- **Rapid-pass sizer** — what to risk on the next evaluation trade, given the
  balance and the drawdown left, at a minimum 1:3.

Balances come from the trades you log against each account, so the guidance
stays current on its own. An account you trade elsewhere can carry a manual
balance instead.

The rules live in `lib/prop-framework.ts` and the calculations in
`lib/prop-firm.ts` — both pure, with no fetching and no clock, so the same
inputs always give the same guidance.

## Getting started

```bash
npm install
npm run dev
```

Apply the SQL in `supabase/migrations/` in order against your Supabase project.
`0007_prop_firm_framework.sql` adds the framework columns and the payout ledger;
without it the Prop Firm page renders but has nothing to reason from.

Open [http://localhost:3000](http://localhost:3000).

## Mock data

All trades, journal entries, and playbooks in `lib/mock-data.ts` are generated from a seeded random source, so the numbers are stable across runs. Swap this module out for real data fetching when persistence is added.
