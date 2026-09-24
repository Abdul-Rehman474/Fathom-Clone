-- 0006_rate_limit_sliding.sql: make the Ask limit a sliding window.
-- 0005 counted per clock minute, so a burst straddling :59 → :00 could send
-- twice the limit. This weights the previous minute by how much of it still
-- falls inside the last 60 seconds. Safe to run more than once.

create or replace function public.bump_rate_limit(p_bucket text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  win timestamptz := date_trunc('minute', now());
  cur int;
  prev int;
  weight numeric := 1 - extract(epoch from (now() - win)) / 60;
begin
  if uid is null then
    return false;
  end if;
  select coalesce(max(hits), 0) into prev from public.rate_limits
    where user_id = uid and bucket = p_bucket and window_start = win - interval '1 minute';
  select coalesce(max(hits), 0) into cur from public.rate_limits
    where user_id = uid and bucket = p_bucket and window_start = win;
  if cur + prev * weight >= p_limit then
    return false;
  end if;
  insert into public.rate_limits as r (user_id, bucket, window_start, hits)
  values (uid, p_bucket, win, 1)
  on conflict (user_id, bucket, window_start) do update set hits = r.hits + 1;
  delete from public.rate_limits where user_id = uid and window_start < win - interval '1 hour';
  return true;
end;
$$;
revoke all on function public.bump_rate_limit(text, int) from public, anon;
grant execute on function public.bump_rate_limit(text, int) to authenticated;
