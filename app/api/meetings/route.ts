import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { MOCK_PROVIDERS } from '@/lib/config';
import { getValidAccessToken } from '@/lib/providers/integrations';
import { googleCreateSpace } from '@/lib/providers/google-meet';
import { zoomCreateMeeting } from '@/lib/providers/zoom';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotetaker } from '@/lib/bot/lifecycle';
import { notetakerErrorMessage } from '@/lib/providers/recall';

const bodySchema = z.object({
  provider: z.enum(['google', 'zoom']),
  title: z.string().max(200).optional(),
  sendNotetaker: z.boolean().optional(),
});

function mockLink(provider: 'google' | 'zoom'): string {
  const id = Math.random().toString(36).slice(2, 10);
  return provider === 'google'
    ? `https://meet.google.com/mock-${id.slice(0, 4)}-${id.slice(4, 8)}`
    : `https://zoom.us/j/${Math.floor(Math.random() * 9e10) + 1e10}`;
}

/** Create a real (or mock) meeting link (architecture.md §6, PRD FR-3.1). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { provider, title, sendNotetaker: autoSend } = parsed.data;

  let meetingUrl: string;
  if (MOCK_PROVIDERS) {
    meetingUrl = mockLink(provider);
  } else {
    const name = provider === 'google' ? 'Google Meet' : 'Zoom';
    // A refresh that fails means the stored grant is no longer valid.
    const token = await getValidAccessToken(supabase, user.id, provider).catch(() => 'expired' as const);
    if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 400 });
    if (token === 'expired') {
      return NextResponse.json(
        { error: 'reconnect', message: `Your ${name} connection has expired. Reconnect it in Settings.` },
        { status: 401 },
      );
    }
    try {
      meetingUrl =
        provider === 'google'
          ? await googleCreateSpace(token)
          : await zoomCreateMeeting(token, title ?? 'Fathom meeting');
    } catch (e) {
      // Provider text stays in the server log, never in the UI.
      console.error('meeting create failed', e);
      const denied = e instanceof Error && /failed: 40[13]/.test(e.message);
      return NextResponse.json(
        {
          error: 'create_failed',
          message: denied
            ? `${name} refused the request. Reconnect it in Settings and try again.`
            : `${name} did not create the meeting. Try again in a moment.`,
        },
        { status: 502 },
      );
    }
  }

  const { data: call } = await supabase
    .from('calls')
    .insert({
      owner_id: user.id,
      source: 'bot',
      platform: provider === 'google' ? 'meet' : 'zoom',
      title: title ?? 'New meeting',
      meeting_url: meetingUrl,
      status: 'scheduled',
    })
    .select('id')
    .single();

  // Auto-send the notetaker so it's waiting when the host opens the meeting.
  let notetaker: 'sent' | 'failed' | 'off' = 'off';
  if (autoSend && call?.id) {
    const db = createAdminClient();
    try {
      await sendNotetaker(db, call.id);
      notetaker = 'sent';
    } catch (e) {
      console.error('notetaker send failed', e);
      notetaker = 'failed';
      // Leave the call in a state the Retry button understands.
      await db
        .from('calls')
        .update({ status: 'failed', failed_stage: 'bot', error: notetakerErrorMessage(e) })
        .eq('id', call.id);
    }
  }

  return NextResponse.json({ callId: call?.id ?? null, meetingUrl, notetaker });
}
