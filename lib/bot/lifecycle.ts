import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createBot,
  getBot,
  mapBotCode,
  removeBot,
  failureReason,
  RECALL_LIVE,
  type RecallStatusChange,
} from '@/lib/providers/recall';
import { renderRecordingBanner } from '@/lib/bot/banner';
import { runPipeline } from '@/lib/pipeline/process';
import type { CallStatus } from '@/lib/types';

type DB = SupabaseClient;
/** Runs long work after the response (routes pass Next's `after`). */
export type Schedule = (fn: () => Promise<void>) => void;

/** Statuses owned by the bot (before the recording reaches the pipeline). */
export const BOT_ACTIVE: CallStatus[] = ['scheduled', 'joining', 'waiting_admit', 'recording', 'uploading'];

const RANK: Partial<Record<CallStatus, number>> = {
  scheduled: 0,
  joining: 1,
  waiting_admit: 2,
  recording: 3,
  uploading: 4,
};

interface BotCall {
  id: string;
  owner_id: string;
  status: CallStatus;
  bot_id: string | null;
  meeting_url: string | null;
  recording_started_at: string | null;
}

const CALL_COLS = 'id, owner_id, status, bot_id, meeting_url, recording_started_at';

/**
 * Create a Recall bot for a call using the owner's bot name and banner
 * setting (PRD FR-3.3), then move the call to `joining`.
 */
export async function sendNotetaker(db: DB, callId: string): Promise<{ botId: string }> {
  const { data: call } = await db.from('calls').select(CALL_COLS).eq('id', callId).single<BotCall>();
  if (!call?.meeting_url) throw new Error('Call has no meeting link');

  const [{ data: settings }, { data: profile }] = await Promise.all([
    db.from('user_settings').select('bot_name, recording_banner').eq('user_id', call.owner_id).maybeSingle(),
    db.from('profiles').select('full_name').eq('id', call.owner_id).maybeSingle(),
  ]);
  const first = (profile?.full_name ?? '').trim().split(/\s+/)[0];
  const botName = settings?.bot_name?.trim() || (first ? `${first}'s Notetaker` : 'Notetaker');
  const banner = settings?.recording_banner !== false;

  const { id: botId } = await createBot({
    meetingUrl: call.meeting_url,
    botName,
    callId,
    bannerJpeg: banner && RECALL_LIVE ? await renderRecordingBanner(botName) : null,
    joinMessage: banner ? `${botName} is recording and transcribing this meeting.` : null,
  });

  await db
    .from('calls')
    .update({
      bot_id: botId,
      status: 'joining',
      failed_stage: null,
      error: null,
      recording_started_at: null,
    })
    .eq('id', callId);
  return { botId };
}

/** Ask the bot to leave; the recording so far is finalized and processed. */
export async function removeNotetaker(db: DB, callId: string): Promise<void> {
  const { data: call } = await db.from('calls').select(CALL_COLS).eq('id', callId).single<BotCall>();
  if (!call?.bot_id) return;
  await removeBot(call.bot_id);
  // Without webhooks (local dev) the next sync picks up call_ended/done.
}

/**
 * Apply one Recall status change to the call that owns `botId`.
 * `eventKey` de-dupes across webhooks and polling (webhook_events PK).
 * Returns true when the change was new.
 */
export async function applyBotChange(
  db: DB,
  botId: string,
  change: RecallStatusChange,
  schedule: Schedule = (fn) => void fn(),
): Promise<boolean> {
  const eventKey = `${botId}:${change.code}:${change.created_at}`;
  const { error: dupe } = await db.from('webhook_events').insert({ provider: 'recall', event_id: eventKey });
  if (dupe) return false;

  // Only the current bot for a call drives it (a retried call has a new bot).
  const { data: call } = await db.from('calls').select(CALL_COLS).eq('bot_id', botId).maybeSingle<BotCall>();
  if (!call || call.status === 'failed' || !BOT_ACTIVE.includes(call.status)) return true;

  const t = mapBotCode(change.code, change.sub_code, change.created_at);
  if (!t) return true;

  if (t.kind === 'status') {
    const admitted = change.code.endsWith('in_call_not_recording') && call.status === 'waiting_admit';
    if ((RANK[t.status] ?? 0) <= (RANK[call.status] ?? 0) && !admitted) return true;
    const patch: Record<string, unknown> = { status: t.status };
    if (t.recordingStartedAt && !call.recording_started_at) {
      patch.recording_started_at = t.recordingStartedAt;
      patch.started_at = t.recordingStartedAt;
    }
    await db.from('calls').update(patch).eq('id', call.id).eq('bot_id', botId);
    return true;
  }

  if (t.kind === 'fatal') {
    await failBot(db, call.id, botId, t.reason);
    return true;
  }

  if (t.kind === 'ended') {
    if (call.recording_started_at) {
      const dur = Math.max(0, Math.round((Date.parse(change.created_at) - Date.parse(call.recording_started_at)) / 1000));
      await db.from('calls').update({ status: 'uploading', duration_sec: dur || null }).eq('id', call.id).eq('bot_id', botId);
    } else {
      await failBot(db, call.id, botId, t.reason ?? 'The notetaker left before recording started.');
    }
    return true;
  }

  // done: recording finalized on Recall's side → hand to the pipeline.
  if (!call.recording_started_at) {
    await failBot(db, call.id, botId, failureReason(null, 'The notetaker left before it could record.'));
    return true;
  }
  // Atomic claim so a webhook and a poll can't both start the pipeline.
  const { data: claimed } = await db
    .from('calls')
    .update({ status: 'transcribing', media_kind: 'video' })
    .eq('id', call.id)
    .eq('bot_id', botId)
    .in('status', BOT_ACTIVE)
    .select('id');
  if (claimed?.length) schedule(() => runPipeline(call.id));
  return true;
}

async function failBot(db: DB, callId: string, botId: string, reason: string) {
  await db
    .from('calls')
    .update({ status: 'failed', failed_stage: 'bot', error: reason })
    .eq('id', callId)
    .eq('bot_id', botId)
    .in('status', BOT_ACTIVE);
}

/**
 * Pull the bot's state from Recall and apply any status changes not yet
 * seen. Used by live-status polling so the lifecycle advances even where
 * webhooks can't reach the app (local dev); de-duped with the webhook path.
 */
export async function syncBot(db: DB, callId: string, schedule?: Schedule): Promise<void> {
  const { data: call } = await db.from('calls').select(CALL_COLS).eq('id', callId).maybeSingle<BotCall>();
  if (!call?.bot_id || !BOT_ACTIVE.includes(call.status)) return;
  const bot = await getBot(call.bot_id);
  const changes = [...(bot.status_changes ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const ch of changes) await applyBotChange(db, call.bot_id, ch, schedule);
}
