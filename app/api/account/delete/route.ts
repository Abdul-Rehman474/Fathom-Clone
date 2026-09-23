import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Delete the current account: storage objects, DB rows (cascade from profile),
 * and the auth user. Uses the service role for the storage + auth deletions
 * (architecture.md §11, PRD §8 privacy).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Remove the user's storage objects.
  for (const bucket of ['recordings', 'thumbnails']) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files?.length) {
      await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  // Deleting the profile cascades to calls, settings, tags, playlists, etc.
  await admin.from('profiles').delete().eq('id', user.id);

  // Remove the auth user.
  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
