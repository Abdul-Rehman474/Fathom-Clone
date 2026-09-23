-- Combined schema — paste this whole file into the Supabase SQL editor and Run.
-- (Concatenation of supabase/migrations/0001..0004 in order.)

-- ===== supabase/migrations/0001_init.sql =====
-- 0001_init.sql — full schema (architecture.md §5)
-- All tables, with generated tsvector columns for full-text search.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  account_type text not null default 'personal' check (account_type in ('personal', 'team')),
  department text,
  role text,
  usage text check (usage in ('solo', 'team')),
  onboarding_step int not null default 1,
  onboarding_done boolean not null default false,
  invite_code text unique not null,
  credits int not null default 25,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- workspaces + membership
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invite_token text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------------------------------------------------------------------------
-- user settings (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bot_name text,
  auto_record text default 'all',
  auto_share text default 'summary_recording',
  notes_on text default 'all',
  share_with text default 'all',
  auto_action_items boolean not null default true,
  default_template text not null default 'general',
  recording_banner boolean not null default true,
  auto_consent boolean not null default false,
  default_share_access text not null default 'link' check (default_share_access in ('link', 'workspace', 'private')),
  in_meeting_chat boolean not null default true,
  anonymized_data boolean not null default true,
  zoom_auto_unscheduled boolean default false,
  meet_auto_unscheduled boolean default false,
  enhanced_recording boolean default false
);

-- ---------------------------------------------------------------------------
-- integrations (encrypted OAuth tokens)
-- ---------------------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google', 'zoom')),
  access_token_enc text,
  refresh_token_enc text,
  expires_at timestamptz,
  scopes text,
  account_email text,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- ---------------------------------------------------------------------------
-- calls (central record)
-- ---------------------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  visibility text not null default 'private' check (visibility in ('private', 'workspace')),
  title text,
  platform text not null check (platform in ('meet', 'zoom', 'teams', 'upload', 'browser')),
  source text not null check (source in ('bot', 'tab', 'upload')),
  meeting_url text,
  bot_id text,
  transcript_job_id text,
  status text not null default 'scheduled',
  failed_stage text,
  error text,
  scheduled_at timestamptz,
  recording_started_at timestamptz,
  started_at timestamptz,
  duration_sec int,
  media_path text,
  media_kind text check (media_kind in ('video', 'audio')),
  thumbnail_path text,
  template text default 'general',
  scratchpad text,
  share_token text unique,
  share_access text default 'private' check (share_access in ('link', 'workspace', 'private')),
  title_tsv tsvector generated always as (to_tsvector('english', coalesce(title, ''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- attendees: maps "Speaker A" → a real name
-- ---------------------------------------------------------------------------
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  name text not null,
  email text,
  speaker_label text
);

-- ---------------------------------------------------------------------------
-- transcript segments
-- ---------------------------------------------------------------------------
create table if not exists public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  idx int not null,
  speaker_label text,
  start_ms int not null,
  end_ms int not null,
  text text not null,
  tsv tsvector generated always as (to_tsvector('english', text)) stored
);

-- ---------------------------------------------------------------------------
-- summaries
-- ---------------------------------------------------------------------------
create table if not exists public.summaries (
  call_id uuid primary key references public.calls (id) on delete cascade,
  template text not null default 'general',
  content jsonb not null,
  overview text,
  tsv tsvector generated always as (to_tsvector('english', coalesce(overview, ''))) stored,
  model text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- action items
-- ---------------------------------------------------------------------------
create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  text text not null,
  assignee text,
  start_ms int,
  done boolean not null default false,
  position int not null default 0
);

-- ---------------------------------------------------------------------------
-- highlight tags + highlights
-- ---------------------------------------------------------------------------
create table if not exists public.highlight_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null,
  position int not null default 0
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  tag_id uuid references public.highlight_tags (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  start_ms int not null,
  end_ms int,
  note text,
  source text not null default 'user' check (source in ('user', 'overlay', 'ai'))
);

-- ---------------------------------------------------------------------------
-- playlists
-- ---------------------------------------------------------------------------
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  title text not null,
  description text,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  highlight_id uuid not null references public.highlights (id) on delete cascade,
  position int not null default 0,
  primary key (playlist_id, highlight_id)
);

-- ---------------------------------------------------------------------------
-- Ask Fathom threads + messages
-- ---------------------------------------------------------------------------
create table if not exists public.ask_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  call_id uuid references public.calls (id) on delete cascade,
  scope text,
  created_at timestamptz not null default now()
);

create table if not exists public.ask_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ask_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- alerts (stretch)
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  keyword text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_hits (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  call_id uuid not null references public.calls (id) on delete cascade,
  segment_id uuid references public.transcript_segments (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- feedback, referrals, webhook dedupe
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('ticket', 'feedback')),
  subject text,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- ===== supabase/migrations/0002_rls.sql =====
-- 0002_rls.sql — Row Level Security on every table (architecture.md §5).
-- Child tables inherit call access through can_view_call().

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Is the current user a member of this workspace?
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

-- Can the current user view this call? Owner, or a workspace-visible call in
-- a workspace they belong to. SECURITY DEFINER so it can be reused in child
-- policies without recursive RLS evaluation.
create or replace function public.can_view_call(c uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.calls call
    where call.id = c
      and (
        call.owner_id = auth.uid()
        or (call.visibility = 'workspace'
            and call.workspace_id is not null
            and public.is_workspace_member(call.workspace_id))
      )
  );
$$;

-- Does the current user own this call?
create or replace function public.owns_call(c uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.calls call where call.id = c and call.owner_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.workspaces         enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.user_settings      enable row level security;
alter table public.integrations       enable row level security;
alter table public.calls              enable row level security;
alter table public.attendees          enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.summaries          enable row level security;
alter table public.action_items       enable row level security;
alter table public.highlight_tags     enable row level security;
alter table public.highlights         enable row level security;
alter table public.playlists          enable row level security;
alter table public.playlist_items     enable row level security;
alter table public.ask_threads        enable row level security;
alter table public.ask_messages       enable row level security;
alter table public.alerts             enable row level security;
alter table public.alert_hits         enable row level security;
alter table public.feedback           enable row level security;
alter table public.referrals          enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: a user sees/edits their own profile; workspace mates are visible
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.workspace_members a
      join public.workspace_members b on a.workspace_id = b.workspace_id
      where a.user_id = auth.uid() and b.user_id = public.profiles.id
    )
  );
drop policy if exists profiles_upsert on public.profiles;
create policy profiles_upsert on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- workspaces + members
-- ---------------------------------------------------------------------------
drop policy if exists ws_select on public.workspaces;
create policy ws_select on public.workspaces for select
  using (owner_id = auth.uid() or public.is_workspace_member(id));
drop policy if exists ws_insert on public.workspaces;
create policy ws_insert on public.workspaces for insert with check (owner_id = auth.uid());
drop policy if exists ws_update on public.workspaces;
create policy ws_update on public.workspaces for update using (owner_id = auth.uid());

drop policy if exists wm_select on public.workspace_members;
create policy wm_select on public.workspace_members for select
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
drop policy if exists wm_insert on public.workspace_members;
create policy wm_insert on public.workspace_members for insert with check (user_id = auth.uid());
drop policy if exists wm_delete on public.workspace_members;
create policy wm_delete on public.workspace_members for delete
  using (user_id = auth.uid() or exists (
    select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- user_settings + integrations: owner only
-- ---------------------------------------------------------------------------
drop policy if exists us_all on public.user_settings;
create policy us_all on public.user_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists int_all on public.integrations;
create policy int_all on public.integrations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- calls: view if owner or workspace-visible; write only by owner
-- ---------------------------------------------------------------------------
drop policy if exists calls_select on public.calls;
create policy calls_select on public.calls for select
  using (
    owner_id = auth.uid()
    or (visibility = 'workspace' and workspace_id is not null and public.is_workspace_member(workspace_id))
  );
drop policy if exists calls_insert on public.calls;
create policy calls_insert on public.calls for insert with check (owner_id = auth.uid());
drop policy if exists calls_update on public.calls;
create policy calls_update on public.calls for update using (owner_id = auth.uid());
drop policy if exists calls_delete on public.calls;
create policy calls_delete on public.calls for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Child tables inherit access via can_view_call(); writes require ownership
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['attendees', 'transcript_segments', 'action_items', 'highlights'] loop
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('create policy %I_select on public.%I for select using (public.can_view_call(call_id));', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.owns_call(call_id)) with check (public.owns_call(call_id));', t, t);
  end loop;
end $$;

-- summaries: keyed by call_id (PK), same rules
drop policy if exists sum_select on public.summaries;
create policy sum_select on public.summaries for select using (public.can_view_call(call_id));
drop policy if exists sum_write on public.summaries;
create policy sum_write on public.summaries for all
  using (public.owns_call(call_id)) with check (public.owns_call(call_id));

-- ---------------------------------------------------------------------------
-- highlight_tags: owner only
-- ---------------------------------------------------------------------------
drop policy if exists tags_all on public.highlight_tags;
create policy tags_all on public.highlight_tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- playlists + items
-- ---------------------------------------------------------------------------
drop policy if exists pl_select on public.playlists;
create policy pl_select on public.playlists for select
  using (owner_id = auth.uid() or (workspace_id is not null and public.is_workspace_member(workspace_id)));
drop policy if exists pl_write on public.playlists;
create policy pl_write on public.playlists for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists pli_select on public.playlist_items;
create policy pli_select on public.playlist_items for select
  using (exists (select 1 from public.playlists p where p.id = playlist_id
    and (p.owner_id = auth.uid() or (p.workspace_id is not null and public.is_workspace_member(p.workspace_id)))));
drop policy if exists pli_write on public.playlist_items;
create policy pli_write on public.playlist_items for all
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- ask threads/messages, alerts, feedback, referrals: owner-scoped
-- ---------------------------------------------------------------------------
drop policy if exists at_all on public.ask_threads;
create policy at_all on public.ask_threads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists am_all on public.ask_messages;
create policy am_all on public.ask_messages for all
  using (exists (select 1 from public.ask_threads t where t.id = thread_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.ask_threads t where t.id = thread_id and t.user_id = auth.uid()));

drop policy if exists al_all on public.alerts;
create policy al_all on public.alerts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists alh_select on public.alert_hits;
create policy alh_select on public.alert_hits for select
  using (exists (select 1 from public.alerts a where a.id = alert_id and a.user_id = auth.uid()));

drop policy if exists fb_all on public.feedback;
create policy fb_all on public.feedback for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists ref_select on public.referrals;
create policy ref_select on public.referrals for select
  using (inviter_id = auth.uid() or invitee_id = auth.uid());

-- ===== supabase/migrations/0003_search.sql =====
-- 0003_search.sql — GIN indexes on the generated tsvector columns, plus the
-- access/order indexes listed in architecture.md §5.

-- Full-text search
create index if not exists calls_title_tsv_idx on public.calls using gin (title_tsv);
create index if not exists segments_tsv_idx on public.transcript_segments using gin (tsv);
create index if not exists summaries_tsv_idx on public.summaries using gin (tsv);

-- Listing / access
create index if not exists calls_owner_created_idx on public.calls (owner_id, created_at desc);
create index if not exists calls_workspace_created_idx on public.calls (workspace_id, created_at desc);
create index if not exists segments_call_idx on public.transcript_segments (call_id, idx);
create index if not exists highlights_call_start_idx on public.highlights (call_id, start_ms);

-- Lookups used by the pipeline / webhooks
create index if not exists calls_bot_id_idx on public.calls (bot_id);
create index if not exists calls_job_id_idx on public.calls (transcript_job_id);
create index if not exists action_items_call_idx on public.action_items (call_id, position);
create index if not exists highlight_tags_user_idx on public.highlight_tags (user_id, position);

-- ===== supabase/migrations/0004_triggers.sql =====
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

