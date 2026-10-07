'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Convert a personal account to a team: create a workspace + owner membership. */
export async function convertToTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: existing } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!existing) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const first = (profile?.full_name ?? 'My').split(' ')[0];
    const { data: ws } = await supabase
      .from('workspaces')
      .insert({ name: `${first}'s Team`, owner_id: user.id, invite_token: randomBytes(16).toString('base64url') })
      .select('id')
      .single();
    if (ws) {
      await supabase.from('workspace_members').insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' });
    }
  }
  await supabase.from('profiles').update({ account_type: 'team', usage: 'team' }).eq('id', user.id);
  revalidatePath('/team');
  return { ok: true };
}
