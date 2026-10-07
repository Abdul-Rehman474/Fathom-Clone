import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecordingUrl } from '@/lib/providers/recall';

/** Returns a fresh signed playback URL for the recording (architecture.md §3.1). */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // RLS ensures the user can view this call.
  const { data: call } = await supabase
    .from('calls')
    .select('media_path, source, bot_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!call) return NextResponse.json({ url: null });
  if (!call.media_path) {
    // Bot recordings live with the provider; their URLs expire, so fetch a fresh one.
    if (call.source === 'bot' && call.bot_id && call.status === 'ready') {
      const rec = await getRecordingUrl(call.bot_id).catch(() => null);
      return NextResponse.json({ url: rec?.url ?? null });
    }
    return NextResponse.json({ url: null });
  }

  const { data } = await supabase.storage.from('recordings').createSignedUrl(call.media_path, 3600);
  return NextResponse.json({ url: data?.signedUrl ?? null });
}
