-- Supabase's security advisor flags `touch_updated_at` for a mutable
-- search_path: without one pinned, unqualified names inside the function
-- resolve against whatever search_path the caller happens to have, so a
-- schema earlier on that path could shadow a built-in. Pin it empty and
-- fully qualify the single call.
-- Already applied to the live project; kept here so a fresh database matches.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public;
revoke execute on function public.touch_updated_at() from anon;
revoke execute on function public.touch_updated_at() from authenticated;
