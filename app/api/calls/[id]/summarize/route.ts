import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { runSummarize } from '@/lib/pipeline/process';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

const bodySchema = z.object({ template: z.string().optional() });

/** (Re)run the summarize step — also used by the "Regenerate" button. */
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

  const { template } = bodySchema.parse(await request.json().catch(() => ({})));
  const patch: Record<string, unknown> = { status: 'summarizing', error: null };
  if (template) patch.template = template;
  await supabase.from('calls').update(patch).eq('id', id);

  after(async () => {
    await runSummarize(createAdminClient(), id);
  });
  return NextResponse.json({ ok: true });
}
