import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryCall } from '@/lib/pipeline/process';

/** Resume a failed call from its failed stage (PRD FR-5.5). */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  await supabase.from('calls').update({ status: 'transcribing', error: null }).eq('id', id);
  after(async () => {
    await retryCall(id);
  });
  return NextResponse.json({ ok: true });
}
