-- 0004_triggers.sql — first-sign-in provisioning, updated_at maintenance,
-- private storage buckets (architecture.md §2, §5).

-- ---------------------------------------------------------------------------
-- On first sign-in, create the profile, default settings and the four default
-- highlight tags. Runs as SECURITY DEFINER off auth.users insert.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  first_name text;
  code text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  first_name := split_part(coalesce(display_name, 'there'), ' ', 1);
  -- short, unique-ish invite code
  code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (id, full_name, email, avatar_url, invite_code)
  values (new.id, display_name, new.email, new.raw_user_meta_data ->> 'avatar_url', code)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, bot_name)
  values (new.id, first_name || '''s Notetaker')
  on conflict (user_id) do nothing;

  insert into public.highlight_tags (user_id, name, color, position)
  values
    (new.id, 'Highlight', '#00B8F5', 0),
    (new.id, 'Positive Reaction', '#22C55E', 1),
    (new.id, 'Needs Review', '#FACC15', 2),
    (new.id, 'Feedback', '#FF7A1A', 3)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at maintenance for calls and playlists
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists calls_touch on public.calls;
create trigger calls_touch before update on public.calls
  for each row execute function public.touch_updated_at();

drop trigger if exists playlists_touch on public.playlists;
create trigger playlists_touch before update on public.playlists
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Private storage buckets. Reads/writes go through signed URLs from the server.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', false)
on conflict (id) do nothing;

-- Owners may manage objects under a folder named by their user id.
drop policy if exists recordings_rw on storage.objects;
create policy recordings_rw on storage.objects for all
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists thumbnails_rw on storage.objects;
create policy thumbnails_rw on storage.objects for all
  using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
