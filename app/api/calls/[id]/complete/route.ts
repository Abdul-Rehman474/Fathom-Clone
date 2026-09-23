import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { runPipeline } from '@/lib/pipeline/process';

const bodySchema = z.object({
  path: z.string().min(1),
  duration_sec: z.number().int().nonnegative().optional(),
  media_kind: z.enum(['audio', 'video']).default('audio'),
});

/**
 * Upload finished → record media metadata and start the pipeline. Returns
 * immediately; transcription/summarization run in the background via after().
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: call } = await supabase.from('calls').select('id, owner_id').eq('id', id).maybeSingle();
  if (!call || call.owner_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { path, duration_sec, media_kind } = parsed.data;

  await supabase
    .from('calls')
    .update({
      media_path: path,
      media_kind,
      duration_sec: duration_sec ?? null,
      status: 'transcribing',
    })
    .eq('id', id);

  after(async () => {
    await runPipeline(id);
  });

  return NextResponse.json({ ok: true });
}
