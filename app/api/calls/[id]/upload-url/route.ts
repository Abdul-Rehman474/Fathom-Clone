import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  ext: z
    .string()
    .regex(/^[a-z0-9]{2,5}$/i)
    .default('webm'),
});

/**
 * Returns a Supabase signed upload URL so the browser uploads directly to
 * storage (never through a serverless function body). Path is namespaced by
 * user id, matching the storage RLS policy (architecture.md §3.3).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Ownership check.
  const { data: call } = await supabase.from('calls').select('id, owner_id').eq('id', id).maybeSingle();
  if (!call || call.owner_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { ext } = parsed.data;
  const path = `${user.id}/${id}.${ext}`;

  const { data, error } = await supabase.storage.from('recordings').createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json(
      { error: 'sign_failed', message: 'The upload could not be prepared. Try again.' },
      { status: 500 },
    );
  }
  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
}
