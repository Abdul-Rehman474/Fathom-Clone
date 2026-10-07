import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Public signed media URL for a shared call: only when the token is valid and
 *  share access is "link" (architecture.md §5, §11). */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const admin = createAdminClient();
  const { data: call } = await admin
    .from('calls')
    .select('media_path, share_access')
    .eq('share_token', token)
    .maybeSingle();
  if (!call || call.share_access !== 'link' || !call.media_path) {
    return NextResponse.json({ url: null }, { status: call ? 200 : 404 });
  }
  const { data } = await admin.storage.from('recordings').createSignedUrl(call.media_path, 3600);
  return NextResponse.json({ url: data?.signedUrl ?? null });
}
