-- Pre-market plans and post-market reviews.
-- Run this in the Supabase SQL Editor after 0001 and 0002.

create table if not exists public.market_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('pre', 'post')),

  -- Pre-market: the plan written before the session opens.
  bias text check (bias in ('Bullish', 'Bearish', 'Neutral')),
  watchlist text[] not null default '{}',
  key_levels text,
  news_events text,
  plan text,
  mental_state text,
  risk_plan text,

  -- Post-market: what actually happened.
  followed_plan text check (followed_plan in ('Yes', 'Partially', 'No')),
  what_went_well text,
  what_went_wrong text,
  lessons text,
  discipline_rating smallint check (discipline_rating between 1 and 10),

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One plan and one review per day keeps the pairing unambiguous.
  unique (user_id, date, kind)
);

create index if not exists market_reviews_user_date_idx
  on public.market_reviews (user_id, date desc);

alter table public.market_reviews enable row level security;

-- Dropped first so the whole file is safe to re-run.
drop policy if exists "Users can view their own market reviews" on public.market_reviews;
drop policy if exists "Users can insert their own market reviews" on public.market_reviews;
drop policy if exists "Users can update their own market reviews" on public.market_reviews;
drop policy if exists "Users can delete their own market reviews" on public.market_reviews;

create policy "Users can view their own market reviews"
  on public.market_reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert their own market reviews"
  on public.market_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own market reviews"
  on public.market_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own market reviews"
  on public.market_reviews for delete
  using (auth.uid() = user_id);

-- Keep updated_at honest so "last edited" can be shown later.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger-only helper: keep it off the REST RPC surface.
revoke execute on function public.touch_updated_at() from public;
revoke execute on function public.touch_updated_at() from anon;
revoke execute on function public.touch_updated_at() from authenticated;

drop trigger if exists market_reviews_touch_updated_at on public.market_reviews;
create trigger market_reviews_touch_updated_at
  before update on public.market_reviews
  for each row execute function public.touch_updated_at();
