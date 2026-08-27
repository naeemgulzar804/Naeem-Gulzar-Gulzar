-- Extends `trades` with the ICT/SMC-specific fields from Naeem's NT Journal
-- (market context, entry model, confluences, psychology, screenshots), and
-- adds a private storage bucket for per-trade chart screenshots.
-- Run this in the Supabase SQL Editor after 0001_init.sql.

alter table public.trades
  add column if not exists session text check (session in ('London', 'New York', 'Asian', 'London/NY Overlap')),
  add column if not exists timeframe text,
  add column if not exists daily_bias text check (daily_bias in ('Bullish', 'Bearish')),
  add column if not exists market_condition text check (market_condition in ('Balanced', 'Imbalanced')),
  add column if not exists h4_candle text,
  add column if not exists liquidity_purge boolean,
  add column if not exists entry_model text,
  add column if not exists entry_time text,
  add column if not exists stop_loss numeric,
  add column if not exists take_profit numeric,
  add column if not exists planned_rr numeric,
  add column if not exists risk_pct numeric,
  add column if not exists result text check (result in ('Win', 'Loss', 'Break Even')),
  add column if not exists confluences text[] not null default '{}',
  add column if not exists emotion_before text,
  add column if not exists emotion_during text,
  add column if not exists emotion_after text,
  add column if not exists confidence smallint check (confidence between 1 and 10),
  add column if not exists entry_reason text,
  add column if not exists exit_reason text,
  add column if not exists mistakes text,
  add column if not exists lessons text,
  add column if not exists screenshot_daily_path text,
  add column if not exists screenshot_h4_path text,
  add column if not exists screenshot_15m_path text;

-- Widen setup-grade from A+/B to A+/A/B/C to match NT's four-tier scale.
alter table public.trades drop constraint if exists trades_grade_check;
alter table public.trades add constraint trades_grade_check check (grade in ('A+', 'A', 'B', 'C'));

-- Backfill result from the existing sign-of-pnl trades so old rows still
-- count correctly in win/loss analytics that now key off `result`.
update public.trades set result = case when pnl >= 0 then 'Win' else 'Loss' end where result is null;

-- ---------------------------------------------------------------------------
-- Screenshot storage: private bucket, one folder per user (auth.uid()/...),
-- enforced by RLS on storage.objects so users can only touch their own files.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', false)
on conflict (id) do nothing;

drop policy if exists "Users can view their own trade screenshots" on storage.objects;
create policy "Users can view their own trade screenshots"
  on storage.objects for select
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own trade screenshots" on storage.objects;
create policy "Users can upload their own trade screenshots"
  on storage.objects for insert
  with check (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own trade screenshots" on storage.objects;
create policy "Users can update their own trade screenshots"
  on storage.objects for update
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own trade screenshots" on storage.objects;
create policy "Users can delete their own trade screenshots"
  on storage.objects for delete
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
