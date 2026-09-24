-- 0007_membership_hardening.sql: pre-Prompt-7 preflight fixes. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Workspace membership. 0002 let any signed-in user insert themselves into ANY
-- workspace whose id they knew (for example a removed member), which exposed
-- that team's calls. A user may now only add themselves as the owner of a
-- workspace they own. Joining by invite link goes through the server with
-- the service role after checking the invite token.
-- ---------------------------------------------------------------------------
drop policy if exists wm_insert on public.workspace_members;
create policy wm_insert on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Calls can only be placed in a workspace the owner belongs to.
-- ---------------------------------------------------------------------------
drop policy if exists calls_update on public.calls;
create policy calls_update on public.calls for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and (workspace_id is null or public.is_workspace_member(workspace_id)));
drop policy if exists calls_insert on public.calls;
create policy calls_insert on public.calls for insert
  with check (owner_id = auth.uid() and (workspace_id is null or public.is_workspace_member(workspace_id)));

-- ---------------------------------------------------------------------------
-- Profiles: users can edit their own profile fields, but not referral
-- credits, their invite code or their id/email (server only).
-- ---------------------------------------------------------------------------
revoke update on public.profiles from authenticated, anon;
grant update (full_name, avatar_url, account_type, department, role, usage, onboarding_step, onboarding_done)
  on public.profiles to authenticated;
