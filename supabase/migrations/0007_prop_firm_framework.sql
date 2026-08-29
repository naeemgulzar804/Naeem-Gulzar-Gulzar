-- The 3-Tier Prop Firm Framework.
--
-- An account already carries a balance and prop-firm limits. What the
-- framework adds is where that account sits in the pipeline (Phase 1 eval,
-- Phase 2, or funded), when its 4-on/1-off cycle started, and what it cost —
-- everything needed to answer "what do I do with this account today".
--
-- Payouts and cuts are events rather than counters: the framework's scale-up
-- rules ask for "3 consecutive payouts", "no cuts in the last 14 days" and
-- "25+ lifetime payouts", none of which a running total can answer.
--
-- Run after 0006.

-- ---------------------------------------------------------------------------
-- Accounts gain their place in the framework.
-- ---------------------------------------------------------------------------
alter table public.accounts
  -- Which prop firm the account is with. Free text: firms come and go.
  add column if not exists firm text,

  -- Tier is derived from phase, never stored: funded = T1, phase2 = T2,
  -- phase1 = T3. Storing both would let them disagree.
  add column if not exists phase text not null default 'funded'
    check (phase in ('phase1', 'phase2', 'funded')),

  -- What the evaluation cost. The framework treats a cut as a known,
  -- fixed business expense, so it has to be known.
  add column if not exists program_cost numeric check (program_cost >= 0),

  -- Anchor for the 4 weeks ON / 1 week OFF cycle. Staggering start dates is
  -- the framework's single most important operational rule, so each account
  -- needs its own anchor rather than a shared one.
  add column if not exists cycle_start date,

  -- Balance override, for an account whose trades are not all journaled here.
  -- Null means "derive it from the logged trades", which is the default and
  -- the reason this app can give guidance without manual updates.
  add column if not exists current_balance numeric check (current_balance >= 0),

  -- Static drawdown measures from the starting balance; trailing measures
  -- from the high-water mark. Prop firms use both, and the difference decides
  -- when the cut trigger actually fires.
  add column if not exists drawdown_basis text not null default 'initial'
    check (drawdown_basis in ('initial', 'peak')),

  -- A personal or live account can live in the journal without being counted
  -- in the tier ratios.
  add column if not exists in_framework boolean not null default true;

-- Existing accounts predate the cycle, so anchor them at their creation day
-- rather than leaving the cycle meter blank.
update public.accounts
   set cycle_start = created_at::date
 where cycle_start is null;

create index if not exists accounts_framework_idx
  on public.accounts (user_id, in_framework, phase, archived_at);

-- ---------------------------------------------------------------------------
-- The payout / cut / purchase ledger.
-- ---------------------------------------------------------------------------
create table if not exists public.prop_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  -- Kept when the account is deleted: a payout you took is history, and the
  -- lifetime payout count drives the upgrade ladder.
  account_id uuid references public.accounts (id) on delete set null,
  -- Denormalised so a deleted account's events still read sensibly.
  account_label text,

  kind text not null
    check (kind in ('payout', 'cut', 'purchase', 'promotion')),

  -- Payout received, evaluation fee paid, or 0 for a promotion.
  amount numeric not null default 0 check (amount >= 0),

  occurred_on date not null default current_date,
  note text,

  created_at timestamptz not null default now()
);

create index if not exists prop_events_user_date_idx
  on public.prop_events (user_id, occurred_on desc, created_at desc);

create index if not exists prop_events_account_idx
  on public.prop_events (account_id, occurred_on desc);

alter table public.prop_events enable row level security;

drop policy if exists "Users can view their own prop events" on public.prop_events;
drop policy if exists "Users can insert their own prop events" on public.prop_events;
drop policy if exists "Users can update their own prop events" on public.prop_events;
drop policy if exists "Users can delete their own prop events" on public.prop_events;

create policy "Users can view their own prop events"
  on public.prop_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own prop events"
  on public.prop_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own prop events"
  on public.prop_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own prop events"
  on public.prop_events for delete
  using (auth.uid() = user_id);
