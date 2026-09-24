import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryCall } from '@/lib/pipeline/process';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotetaker } from '@/lib/bot/lifecycle';

/** Resume a failed call from its failed stage (PRD FR-5.5). */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: call } = await supabase.from('calls').select('owner_id, failed_stage, meeting_url').eq('id', id).maybeSingle();
  if (!call || call.owner_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Bot never recorded (not admitted, removed, …): send a fresh notetaker.
  if (call.failed_stage === 'bot') {
    if (!call.meeting_url) return NextResponse.json({ error: 'no_link' }, { status: 400 });
    try {
      await sendNotetaker(createAdminClient(), id);
    } catch {
      return NextResponse.json({ error: 'send_failed' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, status: 'joining' });
  }

  await supabase.from('calls').update({ status: 'transcribing', error: null }).eq('id', id);
  after(async () => {
    await retryCall(id);
  });
  return NextResponse.json({ ok: true });
}
