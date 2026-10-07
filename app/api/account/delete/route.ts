import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteBotMedia } from '@/lib/providers/recall';

export const maxDuration = 60;

/**
 * Delete the current account: storage objects, bot recordings held by Recall,
 * DB rows (cascade from profile), and the auth user. Uses the service role for
 * the storage + auth deletions (architecture.md §11, PRD §8 privacy). Only
 * ever acts on the signed-in user's own id.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Storage: every object under the user's folder, a page at a time.
  for (const bucket of ['recordings', 'thumbnails']) {
    for (;;) {
      const { data: files, error } = await admin.storage.from(bucket).list(user.id, { limit: 100 });
      if (error) return failed('Your recordings could not be removed. Nothing was deleted yet. Try again.');
      if (!files?.length) break;
      const { error: rmErr } = await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
      if (rmErr) return failed('Your recordings could not be removed. Try again.');
      if (files.length < 100) break;
    }
  }

  // Bot recordings live with Recall until we ask for them to be deleted.
  const { data: botCalls } = await admin
    .from('calls')
    .select('bot_id')
    .eq('owner_id', user.id)
    .not('bot_id', 'is', null);
  await Promise.all((botCalls ?? []).map((c) => deleteBotMedia(c.bot_id as string).catch(() => {})));

  // Deleting the profile cascades to calls, settings, tags, playlists, etc.
  const { error: profileErr } = await admin.from('profiles').delete().eq('id', user.id);
  if (profileErr) return failed('Your data could not be deleted. Try again.');

  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) return failed('Your data was deleted but the sign-in could not be removed. Try again.');

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

function failed(message: string) {
  return NextResponse.json({ error: 'delete_failed', message }, { status: 500 });
}
