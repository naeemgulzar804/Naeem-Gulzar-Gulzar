-- Two additions from the TradeZella comparison:
--   1. Real accounts, so a prop trader can hold several funded accounts with
--      their own balances and limits instead of one implicit account.
--   2. MAE/MFE per trade — how far a trade went against you before it worked,
--      and how far in your favour before you closed it.
-- Run after 0005.

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  name text not null,
  starting_balance numeric not null default 50000,

  -- Prop-firm guardrails. Null means "not enforced".
  daily_loss_limit numeric check (daily_loss_limit > 0),
  max_drawdown numeric check (max_drawdown > 0),
  profit_target numeric check (profit_target > 0),

  -- Personal rules the journal can hold you to.
  max_losses_per_day smallint not null default 2
    check (max_losses_per_day between 1 and 20),
  risk_pct_aligned numeric not null default 1.0
    check (risk_pct_aligned > 0 and risk_pct_aligned <= 100),
  risk_pct_unaligned numeric not null default 0.5
    check (risk_pct_unaligned > 0 and risk_pct_unaligned <= 100),

  -- Archived accounts stay for their history but drop out of the switcher.
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_idx
  on public.accounts (user_id, archived_at, created_at);

alter table public.accounts enable row level security;

drop policy if exists "Users can view their own accounts" on public.accounts;
drop policy if exists "Users can insert their own accounts" on public.accounts;
drop policy if exists "Users can update their own accounts" on public.accounts;
drop policy if exists "Users can delete their own accounts" on public.accounts;

create policy "Users can view their own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

drop trigger if exists accounts_touch_updated_at on public.accounts;
create trigger accounts_touch_updated_at
  before update on public.accounts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Trades gain an account, and the two excursion prices.
-- ---------------------------------------------------------------------------
alter table public.trades
  add column if not exists account_id uuid
    references public.accounts (id) on delete set null,

  -- The worst and best price the trade reached while open. Stored as prices
  -- rather than R so they can be read straight off a chart; R is derived
  -- from entry and stop the same way planned_rr and r_multiple already are.
  add column if not exists mae_price numeric,
  add column if not exists mfe_price numeric;

create index if not exists trades_account_date_idx
  on public.trades (user_id, account_id, date desc);

-- ---------------------------------------------------------------------------
-- Migrate the one-row-per-user account_settings into a real account, and
-- attach every existing trade to it. Idempotent: a user who already has an
-- account is skipped, and only trades with no account are backfilled.
-- ---------------------------------------------------------------------------
insert into public.accounts (
  user_id, name, starting_balance, daily_loss_limit, max_drawdown,
  profit_target, max_losses_per_day, risk_pct_aligned, risk_pct_unaligned
)
select
  s.user_id, 'Main', s.starting_balance, s.daily_loss_limit, s.max_drawdown,
  s.profit_target, s.max_losses_per_day, s.risk_pct_aligned, s.risk_pct_unaligned
from public.account_settings s
where not exists (
  select 1 from public.accounts a where a.user_id = s.user_id
);

-- Users with trades but no settings row never opened Settings; they still
-- need an account to hang those trades on.
insert into public.accounts (user_id, name)
select distinct t.user_id, 'Main'
from public.trades t
where not exists (
  select 1 from public.accounts a where a.user_id = t.user_id
);

-- Explicitly the user's oldest account, so re-running this after a second
-- account exists can't scatter old trades across accounts arbitrarily.
with first_account as (
  select distinct on (user_id) user_id, id
    from public.accounts
   where archived_at is null
   order by user_id, created_at, id
)
update public.trades t
   set account_id = f.id
  from first_account f
 where f.user_id = t.user_id
   and t.account_id is null;
