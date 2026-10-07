import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseMeetingUrl, PLATFORM_NAME } from '@/lib/meeting-url';
import { sendNotetaker } from '@/lib/bot/lifecycle';
import { notetakerErrorMessage } from '@/lib/providers/recall';

const bodySchema = z.object({
  meetingUrl: z.string().max(2000),
  title: z.string().max(200).optional(),
});

/** Join a pasted Meet / Zoom / Teams link with the notetaker (PRD FR-3.2). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const meeting = parseMeetingUrl(parsed.data.meetingUrl);
  if (!meeting) {
    return NextResponse.json(
      { error: 'invalid_link', message: 'Paste a Google Meet, Zoom or Microsoft Teams meeting link.' },
      { status: 400 },
    );
  }

  const { data: call, error } = await supabase
    .from('calls')
    .insert({
      owner_id: user.id,
      source: 'bot',
      platform: meeting.platform,
      title: parsed.data.title?.trim() || `${PLATFORM_NAME[meeting.platform]} meeting`,
      meeting_url: meeting.url,
      status: 'scheduled',
    })
    .select('id')
    .single();
  if (error || !call) return NextResponse.json({ error: 'create_failed' }, { status: 500 });

  const db = createAdminClient();
  try {
    await sendNotetaker(db, call.id);
  } catch (e) {
    console.error('notetaker send failed', e);
    const message = notetakerErrorMessage(e);
    await db.from('calls').update({ status: 'failed', failed_stage: 'bot', error: message }).eq('id', call.id);
    return NextResponse.json({ error: 'send_failed', callId: call.id, message }, { status: 502 });
  }
  return NextResponse.json({ callId: call.id, platform: meeting.platform, status: 'joining' });
}
