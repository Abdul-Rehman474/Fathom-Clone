import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { runSummarize } from '@/lib/pipeline/process';
import { createAdminClient } from '@/lib/supabase/admin';

// The summary runs after the response; Groq on a long call can take a while.
export const maxDuration = 120;

const bodySchema = z.object({ template: z.string().max(40).optional() });

/** (Re)run the summarize step: also used by the "Regenerate" button. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: call } = await supabase.from('calls').select('owner_id').eq('id', id).maybeSingle();
  if (!call || call.owner_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const patch: Record<string, unknown> = { status: 'summarizing', error: null };
  if (parsed.data.template) patch.template = parsed.data.template;
  // Only a finished (or failed) call can be summarized again, and only once at
  // a time: the conditional update is the lock.
  const { data: claimed } = await supabase
    .from('calls')
    .update(patch)
    .eq('id', id)
    .in('status', ['ready', 'failed'])
    .select('id');
  if (!claimed?.length) {
    return NextResponse.json(
      { error: 'busy', message: 'A summary is already being written for this call.' },
      { status: 409 },
    );
  }

  after(async () => {
    await runSummarize(createAdminClient(), id);
  });
  return NextResponse.json({ ok: true });
}
