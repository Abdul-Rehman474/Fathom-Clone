import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listCalls } from '@/lib/queries';
import { CallCard } from '@/components/call/call-card';
import { Button } from '@/components/ui/button';
import { BRAND_NAME } from '@/lib/config';

export const metadata = { title: 'Team Calls' };

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(name)')
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
          <form action="/team" className="mt-8">
            <Button variant="outline">Start 14-Day Trial</Button>
          </form>
        </div>
        <div className="rounded-frame border border-border bg-surface-1 p-8 text-center text-text-3">
          <Users className="mx-auto size-10" />
          <p className="mt-3">Team Calls preview</p>
        </div>
      </div>
    );
  }

  const { calls } = await listCalls({ scope: 'team' });
  const wsName = (membership as { workspaces?: { name?: string } }).workspaces?.name ?? 'Your Team';

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">{wsName} · Team Calls</h1>
      {calls.length === 0 ? (
        <p className="text-text-3">No shared calls yet. Set a call’s visibility to Workspace to share it here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {calls.map((c) => (
            <CallCard key={c.id} call={c} />
          ))}
        </div>
      )}
    </div>
  );
}
