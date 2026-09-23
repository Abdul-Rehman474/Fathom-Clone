import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDeepgramCallback } from '@/lib/providers/deepgram';
import { ingestTranscript } from '@/lib/pipeline/process';

export const maxDuration = 60;

/**
 * Deepgram async callback (architecture.md §4.0). Verifies the secret query
 * param, de-dupes by request_id, and ingests the transcript. The body is the
 * full result, so one request delivers everything.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const callId = url.searchParams.get('call');
  const secret = url.searchParams.get('secret');

  if (!callId || secret !== (process.env.DEEPGRAM_WEBHOOK_SECRET ?? '')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'bad_body' }, { status: 400 });

  const result = parseDeepgramCallback(body);
  const db = createAdminClient();

  // De-dupe on request_id.
  const eventId = result.requestId || `${callId}:${Date.now()}`;
  const { error: dupeErr } = await db
    .from('webhook_events')
    .insert({ provider: 'deepgram', event_id: eventId });
  if (dupeErr) {
    // Duplicate primary key → already processed.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Look up the call by the stored job id when present, else the query param.
  const { data: call } = await db
    .from('calls')
    .select('id, status')
    .eq('id', callId)
    .maybeSingle();
  if (!call) return NextResponse.json({ error: 'unknown_call' }, { status: 404 });
  if (call.status === 'ready') return NextResponse.json({ ok: true, already: true });

  after(async () => {
    await ingestTranscript(db, callId, result);
  });
  return NextResponse.json({ ok: true });
}
