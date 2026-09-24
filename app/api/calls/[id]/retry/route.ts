import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryCall } from '@/lib/pipeline/process';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotetaker } from '@/lib/bot/lifecycle';
import { notetakerErrorMessage } from '@/lib/providers/recall';

// Transcription and the summary run after the response; give them room.
export const maxDuration = 300;

/**
 * Resume a failed call from its failed stage (PRD FR-5.5). The failed → working
 * transition is a single conditional update, so a double click or two tabs
 * start exactly one retry.
 */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: call } = await supabase
    .from('calls')
    .select('owner_id, status, failed_stage, meeting_url')
    .eq('id', id)
    .maybeSingle();
  if (!call || call.owner_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (call.status !== 'failed') {
    return NextResponse.json(
      { error: 'not_failed', message: 'This call is already being processed.' },
      { status: 409 },
    );
  }

  // Bot never recorded (not admitted, removed, …): send a fresh notetaker.
  if (call.failed_stage === 'bot') {
    if (!call.meeting_url) {
      return NextResponse.json({ error: 'no_link', message: 'This call has no meeting link.' }, { status: 400 });
    }
    // Claim first so a double click cannot send two bots.
    const { data: claimedBot } = await supabase
      .from('calls')
      .update({ status: 'joining', error: null })
      .eq('id', id)
      .eq('status', 'failed')
      .select('id');
    if (!claimedBot?.length) {
      return NextResponse.json({ error: 'not_failed', message: 'A notetaker is already on its way.' }, { status: 409 });
    }
    try {
      await sendNotetaker(createAdminClient(), id);
    } catch (e) {
      console.error('notetaker resend failed', e);
      const message = notetakerErrorMessage(e);
      await supabase.from('calls').update({ status: 'failed', error: message }).eq('id', id).eq('status', 'joining');
      return NextResponse.json({ error: 'send_failed', message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, status: 'joining' });
  }

  const next = call.failed_stage === 'summarizing' ? 'summarizing' : 'transcribing';
  const { data: claimed } = await supabase
    .from('calls')
    .update({ status: next, error: null })
    .eq('id', id)
    .eq('status', 'failed')
    .select('id');
  if (!claimed?.length) {
    return NextResponse.json(
      { error: 'not_failed', message: 'This call is already being processed.' },
      { status: 409 },
    );
  }

  after(async () => {
    await retryCall(id);
  });
  return NextResponse.json({ ok: true });
}
