import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_PROVIDERS } from '@/lib/config';
import { mapUtterances, submitToDeepgram, transcribeNow, publicSite, type DeepgramResult } from '@/lib/providers/deepgram';
import { mockUtterances, mockDeepgramExtras } from '@/lib/providers/mock-fixtures';
import { summarizeCall } from '@/lib/ai/summarize';
import type { SummaryContent } from '@/lib/types';
import { sleep } from '@/lib/pipeline/status';
import { getRecordingUrl } from '@/lib/providers/recall';

type DB = SupabaseClient;

async function setStatus(db: DB, callId: string, status: string, extra: Record<string, unknown> = {}) {
  await db.from('calls').update({ status, ...extra }).eq('id', callId);
}

export async function markFailed(db: DB, callId: string, stage: string, error: string) {
  await db.from('calls').update({ status: 'failed', failed_stage: stage, error }).eq('id', callId);
}

/**
 * Entry point once a recording is available (upload complete or bot done).
 * Mock mode fabricates a transcript + summary with short delays so the UI shows
 * each stage; live mode submits to Deepgram and returns (the webhook resumes).
 * Safe to run inside Next `after()` so the request returns quickly.
 */
export async function runPipeline(callId: string): Promise<void> {
  const db = createAdminClient();
  try {
    const { data: call } = await db
      .from('calls')
      .select('id, duration_sec, media_path, media_kind, template, owner_id, title, source, bot_id')
      .eq('id', callId)
      .maybeSingle();
    if (!call) return;

    await setStatus(db, callId, 'transcribing', { failed_stage: null, error: null });

    if (MOCK_PROVIDERS || !process.env.DEEPGRAM_API_KEY) {
      await sleep(1500);
      const utts = mockUtterances(call.duration_sec ?? 360);
      await ingestTranscript(db, callId, {
        utterances: utts,
        duration: call.duration_sec ?? 360,
        requestId: `mock_${callId}`,
        extras: mockDeepgramExtras(),
      });
      return;
    }

    // Live: resolve a media URL (our storage, or a fresh one from the bot
    // provider) and submit to Deepgram; the callback finishes the job.
    let mediaUrl: string | null = null;
    if (call.media_path) {
      const { data: signed } = await db.storage.from('recordings').createSignedUrl(call.media_path, 3600);
      mediaUrl = signed?.signedUrl ?? null;
    } else if (call.source === 'bot' && call.bot_id) {
      // The bot's media can lag its `done` event by a few seconds.
      let rec = await getRecordingUrl(call.bot_id);
      for (let i = 0; !rec && i < 5; i++) {
        await sleep(3000);
        rec = await getRecordingUrl(call.bot_id);
      }
      mediaUrl = rec?.url ?? null;
      if (rec) await db.from('calls').update({ media_kind: rec.kind }).eq('id', callId);
    }
    if (!mediaUrl) throw new Error('Could not get a media URL for this recording');
    if (!publicSite()) {
      // Deepgram can't call back to localhost: transcribe synchronously.
      const result = await transcribeNow(mediaUrl);
      await ingestTranscript(db, callId, result);
      return;
    }
    const { requestId } = await submitToDeepgram({ callId, mediaUrl });
    await db.from('calls').update({ transcript_job_id: requestId }).eq('id', callId);
  } catch (err) {
    await markFailed(db, callId, 'transcribing', err instanceof Error ? err.message : 'Transcription failed');
  }
}

/** Map utterances → segments, then run the summarize stage. */
export async function ingestTranscript(db: DB, callId: string, result: DeepgramResult): Promise<void> {
  try {
    const segments = mapUtterances(result.utterances);
    // Replace any prior segments (idempotent re-ingest).
    await db.from('transcript_segments').delete().eq('call_id', callId);
    if (segments.length) {
      await db.from('transcript_segments').insert(
        segments.map((s) => ({ call_id: callId, ...s })),
      );
    }
    // Ensure attendees exist for each distinct speaker.
    const labels = [...new Set(segments.map((s) => s.speaker_label))];
    const { data: existingAtt } = await db.from('attendees').select('speaker_label').eq('call_id', callId);
    const have = new Set((existingAtt ?? []).map((a) => a.speaker_label));
    const toAdd = labels.filter((l) => !have.has(l));
    if (toAdd.length) {
      await db.from('attendees').insert(
        toAdd.map((l) => ({ call_id: callId, name: l, speaker_label: l })),
      );
    }

    const update: Record<string, unknown> = { status: 'summarizing' };
    if (result.duration) update.duration_sec = Math.round(result.duration);
    await db.from('calls').update(update).eq('id', callId);

    await runSummarize(db, callId, result.extras);
  } catch (err) {
    await markFailed(db, callId, 'transcribing', err instanceof Error ? err.message : 'Transcript ingest failed');
  }
}

/** Summarize stage: write summary, action items, AI highlights, title → ready. */
export async function runSummarize(
  db: DB,
  callId: string,
  extras?: { short?: string; topics?: string[] },
): Promise<void> {
  try {
    const { data: call } = await db
      .from('calls')
      .select('id, template, owner_id, title')
      .eq('id', callId)
      .maybeSingle();
    if (!call) return;

    const { data: segments } = await db
      .from('transcript_segments')
      .select('speaker_label, start_ms, end_ms, text')
      .eq('call_id', callId)
      .order('idx');
    if (!segments || segments.length === 0) throw new Error('No transcript to summarize');

    if (MOCK_PROVIDERS) await sleep(1500);

    const template = call.template ?? 'general';
    const { summary, model } = await summarizeCall(segments, template);

    const content: SummaryContent = {
      ...summary,
      deepgram: extras ? { short: extras.short, topics: extras.topics } : undefined,
    };

    await db.from('summaries').upsert(
      {
        call_id: callId,
        template,
        content,
        overview: summary.overview,
        model,
      },
      { onConflict: 'call_id' },
    );

    // Action items — respect the user's auto setting.
    const { data: settings } = await db
      .from('user_settings')
      .select('auto_action_items')
      .eq('user_id', call.owner_id)
      .maybeSingle();
    await db.from('action_items').delete().eq('call_id', callId);
    if (settings?.auto_action_items !== false && summary.action_items.length) {
      await db.from('action_items').insert(
        summary.action_items.map((a, i) => ({
          call_id: callId,
          text: a.text,
          assignee: a.assignee,
          start_ms: a.start_ms,
          position: i,
        })),
      );
    }

    // AI highlights from decisions, using the user's first tag.
    const { data: tags } = await db
      .from('highlight_tags')
      .select('id, name, position')
      .eq('user_id', call.owner_id)
      .order('position');
    const reviewTag = tags?.find((t) => t.name === 'Needs Review') ?? tags?.[0];
    await db.from('highlights').delete().eq('call_id', callId).eq('source', 'ai');
    if (reviewTag && summary.decisions.length) {
      const rows = summary.decisions
        .filter((d) => d.start_ms != null)
        .slice(0, 4)
        .map((d) => ({
          call_id: callId,
          tag_id: reviewTag.id,
          created_by: call.owner_id,
          start_ms: d.start_ms as number,
          note: d.text,
          source: 'ai' as const,
        }));
      if (rows.length) await db.from('highlights').insert(rows);
    }

    // Title if untitled.
    const untitled = !call.title || /^(untitled|new recording|welcome)/i.test(call.title);
    const patch: Record<string, unknown> = { status: 'ready', failed_stage: null, error: null };
    if (untitled) patch.title = summary.title;
    await db.from('calls').update(patch).eq('id', callId);
  } catch (err) {
    await markFailed(db, callId, 'summarizing', err instanceof Error ? err.message : 'Summarization failed');
  }
}

/** Resume from the failed stage (architecture.md §4). */
export async function retryCall(callId: string): Promise<void> {
  const db = createAdminClient();
  const { data: call } = await db
    .from('calls')
    .select('failed_stage')
    .eq('id', callId)
    .maybeSingle();
  const stage = call?.failed_stage ?? 'transcribing';
  if (stage === 'summarizing') {
    await setStatus(db, callId, 'summarizing', { failed_stage: null, error: null });
    await runSummarize(db, callId);
  } else {
    await runPipeline(callId);
  }
}
