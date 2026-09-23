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
