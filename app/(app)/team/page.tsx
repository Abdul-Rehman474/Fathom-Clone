import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listCalls } from '@/lib/queries';
import { CallCard } from '@/components/call/call-card';
import { TeamInvite } from '@/components/app/team-invite';
import { TeamUpsellCta } from '@/components/app/team-upsell-cta';
import { Avatar } from '@/components/ui/avatar';
import { BRAND_NAME } from '@/lib/config';

export const metadata = { title: 'Team Calls' };

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(name, owner_id, invite_token)')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();

  if (!membership) {
    return (
      <div className="mx-auto grid max-w-4xl gap-8 py-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-3">
            {BRAND_NAME} Team Edition
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Bring the productivity boost of {BRAND_NAME} to your entire team
          </h1>
          <ul className="mt-6 space-y-2 text-gold">
            <li>✓ Your team’s customer calls all in one searchable place</li>
            <li>✓ Shared playlists and highlights</li>
            <li>✓ Team analytics and coaching opportunities</li>
          </ul>
          <div className="mt-8">
            <TeamUpsellCta />
          </div>
        </div>
        <div className="rounded-frame border border-border bg-surface-1 p-8 text-center text-text-3">
          <Users className="mx-auto size-10" />
          <p className="mt-3">Team Calls preview</p>
        </div>
      </div>
    );
  }

  const ws = (membership as { workspaces?: { name?: string; owner_id?: string; invite_token?: string } }).workspaces;
  const isOwner = ws?.owner_id === user?.id;

  const [{ calls }, { data: members }] = await Promise.all([
    listCalls({ scope: 'team' }),
    supabase
      .from('workspace_members')
      .select('role, profiles(full_name, email)')
      .eq('workspace_id', membership.workspace_id),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{ws?.name ?? 'Team'} · Team Calls</h1>
          {isOwner && ws?.invite_token && <TeamInvite inviteToken={ws.invite_token} />}
        </div>
        {calls.length === 0 ? (
          <p className="text-text-3">No shared calls yet. Set a call’s visibility to Workspace to share it here.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {calls.map((c) => (
              <CallCard key={c.id} call={c} />
            ))}
          </div>
        )}
      </div>

      <aside>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
          Members {members ? `(${members.length})` : ''}
        </h2>
        <div className="space-y-2">
          {(members ?? []).map((m, i) => {
            const p = (m as { profiles?: { full_name?: string; email?: string } }).profiles;
            const name = p?.full_name ?? p?.email ?? 'Member';
            return (
              <div key={i} className="flex items-center gap-2 rounded-card border border-border bg-surface-1 p-2">
                <Avatar name={name} size={28} />
                <div className="min-w-0">
                  <div className="truncate text-sm">{name}</div>
                  <div className="text-xs text-text-3 capitalize">{m.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
