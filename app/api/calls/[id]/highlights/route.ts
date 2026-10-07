import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  tagId: z.string().uuid(),
  /** Tab capture only: elapsed time measured by the recorder's own clock. */
  offsetMs: z.number().int().min(0).max(6 * 3600_000).optional(),
});

/**
 * In-meeting highlight (PRD FR-4.3): stores the tag and the offset from the
 * recording start, so it lands at the right moment on the call page. For bot
 * calls the server measures the offset from `recording_started_at`.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // The click moment: measured before any database round trip can delay it.
  const receivedAt = Date.now();
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const [{ data: call }, { data: tag }] = await Promise.all([
    supabase.from('calls').select('id, owner_id, source, status, recording_started_at').eq('id', id).maybeSingle(),
    supabase.from('highlight_tags').select('id').eq('id', parsed.data.tagId).eq('user_id', user.id).maybeSingle(),
  ]);
  if (!call || call.owner_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (call.status !== 'recording' || !call.recording_started_at) {
    return NextResponse.json(
      { error: 'not_recording', message: 'Highlights work once the recording has started.' },
      { status: 409 },
    );
  }

  const offsetMs =
    call.source === 'tab' && parsed.data.offsetMs != null
      ? parsed.data.offsetMs
      : Math.max(0, receivedAt - Date.parse(call.recording_started_at));

  if (!tag) return NextResponse.json({ error: 'unknown_tag' }, { status: 400 });

  const { data: row, error } = await supabase
    .from('highlights')
    .insert({ call_id: id, tag_id: tag.id, created_by: user.id, start_ms: offsetMs, source: 'overlay' })
    .select('id, start_ms')
    .single();
  if (error || !row) return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  return NextResponse.json({ id: row.id, startMs: row.start_ms });
}
