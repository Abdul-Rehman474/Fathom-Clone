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
