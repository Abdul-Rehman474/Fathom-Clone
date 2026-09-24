import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Tab capture: stamp the moment the recorder started, which the overlay timer
 * and highlight offsets are measured from. Idempotent.
 */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = new Date().toISOString();
  const { data } = await supabase
    .from('calls')
    .update({ recording_started_at: now, started_at: now })
    .eq('id', id)
    .eq('owner_id', user.id)
    .eq('source', 'tab')
    .is('recording_started_at', null)
    .select('recording_started_at');
  return NextResponse.json({ ok: true, recordingStartedAt: data?.[0]?.recording_started_at ?? null });
}
