-- 0005_hardening.sql: Prompt 6 security hardening (PRD §8, architecture.md §11).
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- webhook_events: server-only. RLS on with no policies, so only the service
-- role (webhook handlers) can read or write it.
-- ---------------------------------------------------------------------------
alter table public.webhook_events enable row level security;

-- ---------------------------------------------------------------------------
-- Ask rate limit: one row per user, bucket and minute (architecture.md §11
-- "simple DB counter per minute"). Written only through bump_rate_limit().
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (user_id, bucket, window_start)
);
alter table public.rate_limits enable row level security;

-- Counts one request for the calling user and says whether it is allowed.
-- Atomic under concurrency (insert ... on conflict increments in one step).
create or replace function public.bump_rate_limit(p_bucket text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  win timestamptz := date_trunc('minute', now());
  n int;
begin
  if uid is null then
    return false;
  end if;
  insert into public.rate_limits as r (user_id, bucket, window_start, hits)
  values (uid, p_bucket, win, 1)
  on conflict (user_id, bucket, window_start) do update set hits = r.hits + 1
  returning hits into n;
  -- Keep the table small: old windows are useless.
  delete from public.rate_limits where user_id = uid and window_start < win - interval '1 hour';
  return n <= p_limit;
end;
$$;
revoke all on function public.bump_rate_limit(text, int) from public, anon;
grant execute on function public.bump_rate_limit(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Playlists may only hold highlights the owner can see. Without this a user
-- who learned a highlight id could add it to a shared playlist.
-- ---------------------------------------------------------------------------
drop policy if exists pli_write on public.playlist_items;
create policy pli_write on public.playlist_items for all
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()))
  with check (
    exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid())
    and exists (select 1 from public.highlights h where h.id = highlight_id and public.can_view_call(h.call_id))
  );
