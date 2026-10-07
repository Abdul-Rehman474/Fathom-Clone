import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Join a workspace from an invite link (PRD FR-11.1). Requires sign-in. */
export default async function JoinPage({ params }: { params: Promise<{ inviteToken: string }> }) {
  const { inviteToken } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/join/${encodeURIComponent(inviteToken)}`);

  // Look up the workspace by token with the service role (invitee isn't a member yet).
  const admin = createAdminClient();
  const { data: ws } = await admin.from('workspaces').select('id, name').eq('invite_token', inviteToken).maybeSingle();

  if (!ws) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-lg font-semibold">Invalid invite</h1>
        <p className="mt-2 text-text-2">This invite link is no longer valid.</p>
      </div>
    );
  }

  await admin
    .from('workspace_members')
    // ignoreDuplicates: an existing member (or the owner) keeps their role.
    .upsert(
      { workspace_id: ws.id, user_id: user.id, role: 'member' },
      { onConflict: 'workspace_id,user_id', ignoreDuplicates: true },
    );
  await admin.from('profiles').update({ account_type: 'team', usage: 'team' }).eq('id', user.id);

  redirect('/team');
}
