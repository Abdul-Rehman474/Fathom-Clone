import 'server-only';
import type { Utterance } from '@/lib/providers/mock-fixtures';
import { SITE_URL } from '@/lib/supabase/env';

/** Speaker index → "Speaker A" (architecture.md §4.0). */
export function speakerLabel(speaker: number): string {
  return 'Speaker ' + String.fromCharCode(65 + Math.max(0, speaker));
}

export interface MappedSegment {
  idx: number;
  speaker_label: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

/** Deepgram utterances → transcript_segments rows (seconds → ms). */
export function mapUtterances(utts: Utterance[]): MappedSegment[] {
  return utts.map((u, i) => ({
    idx: i,
    speaker_label: speakerLabel(u.speaker),
    start_ms: Math.round(u.start * 1000),
    end_ms: Math.round(u.end * 1000),
    text: u.transcript.trim(),
  }));
}

export interface DeepgramResult {
  utterances: Utterance[];
  duration: number;
  requestId: string;
  extras: { short?: string; topics?: string[] };
}

/** Parse a Deepgram callback body into the shape the pipeline consumes. */
export function parseDeepgramCallback(body: unknown): DeepgramResult {
  const b = body as {
    metadata?: { duration?: number; request_id?: string };
    results?: {
      utterances?: { speaker?: number; start: number; end: number; transcript: string }[];
      channels?: { alternatives?: { transcript?: string }[] }[];
      summary?: { short?: string };
      topics?: { segments?: { topics?: { topic?: string }[] }[] };
    };
  };
  const raw = b.results?.utterances ?? [];
  let utterances: Utterance[] = raw.map((u) => ({
    speaker: u.speaker ?? 0,
    start: u.start,
    end: u.end,
    transcript: u.transcript,
  }));
  // Fallback: single segment from the channel transcript.
  if (utterances.length === 0) {
    const t = b.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
    const dur = b.metadata?.duration ?? 0;
    if (t) utterances = [{ speaker: 0, start: 0, end: dur, transcript: t }];
  }
  const topics =
    b.results?.topics?.segments
      ?.flatMap((s) => s.topics ?? [])
      .map((t) => t.topic ?? '')
      .filter(Boolean) ?? [];
  return {
    utterances,
    duration: b.metadata?.duration ?? 0,
    requestId: b.metadata?.request_id ?? '',
    extras: { short: b.results?.summary?.short, topics },
  };
}

/**
 * Submit a recording to Deepgram (async; the result arrives at the callback).
 * Returns the request_id used as the dedupe key. Live mode only.
 */
const LISTEN_PARAMS = {
  model: 'nova-3',
  diarize: 'true',
  utterances: 'true',
  smart_format: 'true',
  punctuate: 'true',
  paragraphs: 'true',
  detect_language: 'true',
  summarize: 'v2',
  topics: 'true',
  sentiment: 'true',
};

/** True when NEXT_PUBLIC_SITE_URL is reachable by provider callbacks. */
export function publicSite(): boolean {
  const site = SITE_URL;
  return /^https:\/\//.test(site) && !/localhost|127\.0\.0\.1/.test(site);
}

/** Synchronous transcription (no callback) for local development. */
export async function transcribeNow(mediaUrl: string): Promise<DeepgramResult> {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error('Deepgram not configured');
  const res = await fetch(`https://api.deepgram.com/v1/listen?${new URLSearchParams(LISTEN_PARAMS)}`, {
    method: 'POST',
    headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: mediaUrl }),
    // Pre-recorded transcription runs at many times real time; this covers
    // multi-hour files and still ends inside the route's 300 s budget.
    signal: AbortSignal.timeout(240_000),
  });
  if (!res.ok) throw new Error(`Deepgram failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return parseDeepgramCallback(await res.json());
}

export async function submitToDeepgram(params: { callId: string; mediaUrl: string }): Promise<{ requestId: string }> {
  const key = process.env.DEEPGRAM_API_KEY;
  const site = SITE_URL;
  const secret = process.env.DEEPGRAM_WEBHOOK_SECRET ?? '';
  if (!key || !site) throw new Error('Deepgram or site URL not configured');

  const qs = new URLSearchParams({
    ...LISTEN_PARAMS,
    callback: `${site}/api/webhooks/deepgram?call=${params.callId}&secret=${encodeURIComponent(secret)}`,
  });

  const res = await fetch(`https://api.deepgram.com/v1/listen?${qs}`, {
    method: 'POST',
    headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: params.mediaUrl }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Deepgram submit failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { request_id?: string };
  return { requestId: json.request_id ?? '' };
}
