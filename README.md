# TradeLog

A trading journal web app, inspired by TradeZella. Track trades, review performance, and refine your edge.

Built with Next.js (App Router) and Tailwind CSS. This first version is a static UI wired to mock data — no auth or persistence yet.

## Pages

- **Dashboard** (`/`) — net P&L, win rate, profit factor, equity curve, recent trades.
- **Trade Log** (`/trades`) — filterable table of every logged trade.
- **Calendar** (`/calendar`) — monthly heatmap of daily P&L.
- **Journal & Playbooks** (`/journal`) — saved strategy setups and daily reflections.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mock data

All trades, journal entries, and playbooks in `lib/mock-data.ts` are generated from a seeded random source, so the numbers are stable across runs. Swap this module out for real data fetching when persistence is added.
