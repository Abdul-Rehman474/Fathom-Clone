import { createClient } from '@/lib/supabase/server';
import { listCalls } from '@/lib/queries';
import { MeetingRow } from '@/components/call/meeting-row';
import { TeamInvite } from '@/components/app/team-invite';
import { TeamUpsellCta } from '@/components/app/team-upsell-cta';
import { ProductFrame } from '@/components/marketing/product-frame';
import { Avatar } from '@/components/ui/avatar';
import { PageHeading, EmptyState } from '@/components/ui/page-heading';
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

  // No workspace yet → Team Edition upsell.
  if (!membership) {
    return (
      <div className="mx-auto grid max-w-5xl gap-12 py-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="micro-label mb-3">{BRAND_NAME} Team Edition</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Bring every conversation into one shared workspace.
          </h1>
          <ul className="mt-8 space-y-3 text-text-2">
            {[
              'Your team’s customer calls, in one searchable place',
              'Shared playlists of the moments that matter',
              'Coaching opportunities surfaced from real calls',
            ].map((t) => (
              <li key={t} className="flex gap-3 border-b border-border pb-3">
                <span className="text-lime">✓</span> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <TeamUpsellCta />
          </div>
        </div>
        <ProductFrame kind="team" />
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
    <div className="grid gap-10 xl:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        <PageHeading
          eyebrow={ws?.name ?? 'Workspace'}
          title="Team Calls"
          description="Calls your teammates have shared with the workspace."
          actions={isOwner && ws?.invite_token ? <TeamInvite inviteToken={ws.invite_token} /> : undefined}
        />
        {calls.length === 0 ? (
          <EmptyState
            label="No shared calls yet"
            body="Open any call and choose “Share with workspace” from its menu to make it appear here."
          />
        ) : (
          <div className="border-t border-border">
            {calls.map((c) => (
              <MeetingRow key={c.id} call={c} />
            ))}
          </div>
        )}
      </div>

      <aside className="xl:pt-2">
        <p className="micro-label mb-3">Members · {members?.length ?? 0}</p>
        <div className="border-t border-border">
          {(members ?? []).map((m, i) => {
            const p = (m as { profiles?: { full_name?: string; email?: string } }).profiles;
            const name = p?.full_name ?? p?.email ?? 'Member';
            return (
              <div key={i} className="flex items-center gap-3 border-b border-border py-3">
                <Avatar name={name} size={28} />
                <div className="min-w-0">
                  <div className="truncate text-sm">{name}</div>
                  <div className="text-xs capitalize text-text-3">{m.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
