# 3-Tier Prop Firm Control Room

A standalone system implementing the 3-Tier Funding Framework. **Completely separate
from the trading journal** — it shares no database tables, no code, and no data.

## Opening it

It is one self-contained HTML file with no build step and no dependencies.

- **Locally:** open `public/prop-firm/index.html` in any browser. Bookmark it.
- **Deployed:** it is served at `/prop-firm/` on whatever URL the site runs on.

Pick one and stay with it. Data is stored in the browser's `localStorage`, which is
scoped to the location the page was opened from — opening it from a file path and from
the deployed URL gives you two separate, unconnected sets of data.

## What it does

| Tab | Purpose |
|---|---|
| **Today** | The action engine. Reads the rules against your balances and lists what to do, breaches first. |
| **Accounts** | Every eval and funded account. Update balances here; everything else derives from them. |
| **Capital & Ratios** | Where the next payout dollar goes, 5:3:2 compliance, reinvestment stage, scale-up checklist, upgrade ladder. |
| **Payouts** | Log a payout; it is split across T3/T2/T1/personal in the guide's priority order. Lifetime count feeds the upgrade gates. |
| **Stagger Schedule** | 4-on/1-off cycle per funded account, 10 weeks forward, with collision detection. |
| **Position Sizing** | Risk and lot size per trade, plus the trade log that feeds the 40% win-rate gate. |
| **Path to $500K** | The nine-step journey, with your current step detected from your actual numbers. |
| **Settings & Data** | Rule thresholds (all editable) and JSON export/import. |

## Two things the guide left open, and how they are handled

**1. The position-sizing formula.** The guide demands one ("follow the formula exactly",
"do not estimate manually") but never states it. The calculator derives the smallest
formula satisfying all five of the guide's stated sizing rules:

```
recovery = (target - current profit) / RR     grows after each loss  -> escalation
reserve  = min(remaining drawdown, full drawdown budget / attempts)
cap      = balance x hard cap %
RISK     = min(recovery, reserve, cap)
```

`recovery` grows after every loss, which produces the escalation the guide asks for.
`reserve` is measured against the account's *original* drawdown allowance and then
clipped to what is actually left — so size can escalate freely but can never cross the
cut line. The binding constraint is always displayed, so no number is a black box.
Every input is editable under Settings.

**2. The guide's rules conflict on evaluations.** Clearing an 8% Phase 1 target in one
1:3 win costs 2.67% of risk, but the −4% cut rule only allows 4% of room in total. The
two rules cannot both hold on a single trade, so an evaluation is a multi-win job by
construction. The calculator says so explicitly rather than papering over it, and tells
you how many winners the account actually needs at the current size.

## Backups

`localStorage` is per-browser and per-origin. It is cleared by clearing site data, and
it does not follow you to another device. **Export a backup from Settings & Data after
any session that matters.**
