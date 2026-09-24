import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDeepgramCallback } from '@/lib/providers/deepgram';
import { ingestTranscript } from '@/lib/pipeline/process';

// Ingest + summary run after the 200 goes back to Deepgram.
export const maxDuration = 300;

function secretMatches(given: string | null): boolean {
  const expected = process.env.DEEPGRAM_WEBHOOK_SECRET;
  // An unset secret must never let an empty one through.
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Deepgram async callback (architecture.md §4.0). Verifies the shared secret,
 * finds the call by the stored `transcript_job_id` (never by the query param
 * alone), de-dupes on request_id, and ingests the transcript after replying.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const callId = url.searchParams.get('call');
  if (!callId || !secretMatches(url.searchParams.get('secret'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'bad_body' }, { status: 400 });

  const result = parseDeepgramCallback(body);
  if (!result.requestId) return NextResponse.json({ error: 'no_request_id' }, { status: 400 });
  const db = createAdminClient();

  const { data: call } = await db
    .from('calls')
    .select('id, status')
    .eq('transcript_job_id', result.requestId)
    .eq('id', callId)
    .maybeSingle();
  if (!call) return NextResponse.json({ error: 'unknown_job' }, { status: 404 });

  // De-dupe on request_id: the primary key makes the second insert fail.
  const { error: dupeErr } = await db
    .from('webhook_events')
    .insert({ provider: 'deepgram', event_id: result.requestId });
  if (dupeErr) {
    if (dupeErr.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    // Could not record the event: let Deepgram retry later rather than risk a double ingest.
    return NextResponse.json({ error: 'dedupe_unavailable' }, { status: 503 });
  }
  if (call.status !== 'transcribing') return NextResponse.json({ ok: true, already: true });

  after(async () => {
    await ingestTranscript(db, call.id, result);
  });
  return NextResponse.json({ ok: true });
}
