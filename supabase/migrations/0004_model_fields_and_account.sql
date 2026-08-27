-- Brings the journal in line with the actual trading model: the three A+
-- criteria (Daily alignment, SMT divergence, H4 liquidity sweep), how the
-- entry was executed, and the prop-account limits the equity curve and the
-- dashboard guardrails are measured against.
-- Run this in the Supabase SQL Editor after 0003_market_reviews.sql.

-- ---------------------------------------------------------------------------
-- The model criteria, as recorded per trade.
-- ---------------------------------------------------------------------------
alter table public.trades
  -- Criterion 1: does Daily TF bias agree with the H4 direction traded?
  -- Null means it was never recorded (every row that predates this file).
  add column if not exists daily_aligned boolean,

  -- Criterion 2: SMT divergence. "Forced" is the one that matters — it is
  -- the difference between a rule and a story told after the fact.
  add column if not exists smt_quality text
    check (smt_quality in ('Clear', 'Borderline', 'Forced', 'None')),
  add column if not exists smt_pair text
    check (smt_pair in ('GBPUSD', 'DXY', 'Both', 'None')),

  -- Criterion 3: H4 liquidity sweep, graded rather than yes/no. The old
  -- boolean `liquidity_purge` column stays for the rows that used it.
  add column if not exists sweep_quality text
    check (sweep_quality in ('Clean', 'Borderline', 'None')),

  -- The recurring execution mistake: entering on the engulfing candle
  -- instead of waiting for price to return to the 15M orderblock.
  add column if not exists entry_execution text
    check (entry_execution in (
      'OB retest',
      'Early — engulfing candle',
      'Late — chased after retest',
      'Other'
    ));

-- Backfill the sweep grade from the old boolean so existing rows still carry
-- the signal they were logged with. A recorded "yes" only proves a sweep was
-- seen, not that it was clean, so it becomes 'Borderline' rather than
-- 'Clean' — the honest reading of a checkbox that never asked about quality.
update public.trades
   set sweep_quality = case when liquidity_purge then 'Borderline' else 'None' end
 where sweep_quality is null
   and liquidity_purge is not null;

-- ---------------------------------------------------------------------------
-- Account settings: one row per user, created on demand.
-- ---------------------------------------------------------------------------
create table if not exists public.account_settings (
  user_id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,

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

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_settings enable row level security;

-- Dropped first so the whole file is safe to re-run.
drop policy if exists "Users can view their own account settings" on public.account_settings;
drop policy if exists "Users can insert their own account settings" on public.account_settings;
drop policy if exists "Users can update their own account settings" on public.account_settings;
drop policy if exists "Users can delete their own account settings" on public.account_settings;

create policy "Users can view their own account settings"
  on public.account_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own account settings"
  on public.account_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own account settings"
  on public.account_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own account settings"
  on public.account_settings for delete
  using (auth.uid() = user_id);

-- public.touch_updated_at() is defined in 0003 and already revoked from the
-- REST RPC surface there.
drop trigger if exists account_settings_touch_updated_at on public.account_settings;
create trigger account_settings_touch_updated_at
  before update on public.account_settings
  for each row execute function public.touch_updated_at();
