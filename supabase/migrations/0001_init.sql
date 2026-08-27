-- TradeLog schema: trades, playbooks, journal entries.
-- Run this once in the Supabase SQL Editor for your project
-- (or via `supabase db push` if you use the Supabase CLI).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- trades
-- ---------------------------------------------------------------------------
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  symbol text not null,
  side text not null check (side in ('long', 'short')),
  playbook text,
  grade text check (grade in ('A+', 'B')),
  entry_price numeric,
  exit_price numeric,
  size numeric,
  risk_amount numeric,
  r_multiple numeric,
  pnl numeric not null,
  duration_minutes integer,
  tags text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists trades_user_id_date_idx on public.trades (user_id, date desc);

alter table public.trades enable row level security;

create policy "Users can view their own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trades"
  on public.trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on public.trades for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- playbooks
-- ---------------------------------------------------------------------------
create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  summary text,
  rules text[] not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists playbooks_user_id_idx on public.playbooks (user_id);

alter table public.playbooks enable row level security;

create policy "Users can view their own playbooks"
  on public.playbooks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own playbooks"
  on public.playbooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own playbooks"
  on public.playbooks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own playbooks"
  on public.playbooks for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  title text not null,
  mood text check (mood in ('confident', 'neutral', 'frustrated', 'disciplined')),
  content text,
  linked_trade_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_date_idx on public.journal_entries (user_id, date desc);

alter table public.journal_entries enable row level security;

create policy "Users can view their own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own journal entries"
  on public.journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own journal entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed four starter playbooks for every new user, based on Naeem's
-- liquidity/SMT/orderblock price-action model.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user_playbooks()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.playbooks (user_id, name, summary, rules, tags)
  values
    (
      new.id,
      'Liquidity Sweep + FVG',
      'Sweep of session/dealing-range liquidity followed by a Fair Value Gap entry back in the direction of the higher-timeframe bias.',
      array[
        'Mark the dealing range and prior session highs/lows',
        'Wait for a liquidity sweep during London or NY kill zone',
        'Confirm displacement leaves an FVG in the reversal direction',
        'Entry on FVG retracement, stop beyond the sweep wick',
        'Target opposing liquidity or 2R minimum'
      ],
      array['liquidity', 'fvg', 'kill-zone']
    ),
    (
      new.id,
      'SMT Divergence Reversal',
      'Inter-market divergence (e.g. EURUSD vs GBPUSD) at a key level, confirming a false move before reversal.',
      array[
        'Identify correlated pair failing to make the same high/low',
        'Confluence with a dealing-range extreme',
        'Wait for CHoCH on the entry timeframe',
        'Entry on retest of the CHoCH orderblock'
      ],
      array['smt', 'divergence', 'reversal']
    ),
    (
      new.id,
      'Orderblock Retest',
      'Continuation entry on a retest of the last-down/last-up candle before an impulsive displacement.',
      array[
        'Displacement breaks structure with strong momentum',
        'Mark the origin orderblock of the move',
        'Enter on first retest with rejection confirmation',
        'Stop beyond the orderblock, target next liquidity pool'
      ],
      array['orderblock', 'continuation']
    ),
    (
      new.id,
      'Kill Zone Range Breakout',
      'Asian range breakout during the London kill zone, trading with the initial displacement.',
      array[
        'Mark the Asian session range',
        'Wait for London kill zone displacement through the range',
        'Entry on the retest of the broken range edge',
        'Stop inside the range, target measured move'
      ],
      array['breakout', 'session-range', 'kill-zone']
    );
  return new;
end;
$$;

-- Trigger-only: keep it off the REST RPC surface. A SECURITY DEFINER function
-- that anon/authenticated can call is a privilege-escalation hole. Triggers
-- still fire after this, since they run as the table owner rather than through
-- EXECUTE grants.
revoke execute on function public.handle_new_user_playbooks() from public;
revoke execute on function public.handle_new_user_playbooks() from anon;
revoke execute on function public.handle_new_user_playbooks() from authenticated;

drop trigger if exists on_auth_user_created_seed_playbooks on auth.users;
create trigger on_auth_user_created_seed_playbooks
  after insert on auth.users
  for each row execute function public.handle_new_user_playbooks();
