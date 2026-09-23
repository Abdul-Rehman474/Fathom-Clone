import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    .select('media_path')
    .eq('id', id)
    .maybeSingle();
  if (!call?.media_path) return NextResponse.json({ url: null });

  const { data } = await supabase.storage.from('recordings').createSignedUrl(call.media_path, 3600);
  return NextResponse.json({ url: data?.signedUrl ?? null });
}
