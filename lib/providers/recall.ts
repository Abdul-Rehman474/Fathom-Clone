import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Recall.ai notetaker client (architecture.md §3.1). Field and event names
 * checked against docs.recall.ai (Create Bot, Leave Call, Bot Status Change
 * Events, Sub Codes, Verifying webhooks) on 2026-09-24. Keep every Recall
 * detail in this file.
 */

/**
 * The notetaker is always real: there is no simulated bot. Without a key the
 * send route refuses with a clear message instead of pretending a bot joined.
 */
export const RECALL_LIVE = !!process.env.RECALL_API_KEY;

export class NotetakerUnavailableError extends Error {
  constructor() {
    super('The notetaker isn’t set up on this server yet (RECALL_API_KEY is missing).');
  }
}

function base(): string {
  return (process.env.RECALL_REGION_BASE_URL ?? 'https://us-west-2.recall.ai').trim().replace(/\/$/, '');
}

async function recall<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base()}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${process.env.RECALL_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new RecallError(res.status, text.slice(0, 300));
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export class RecallError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Recall ${status}: ${body}`);
  }
}

/** A sentence for the UI when sending or removing the bot fails. Raw Recall text stays server side. */
export function notetakerErrorMessage(e: unknown): string {
  if (e instanceof NotetakerUnavailableError) return e.message;
  if (e instanceof RecallError) {
    if (e.status === 400 && /meeting_url/i.test(e.body)) return 'The notetaker could not use that meeting link.';
    if (e.status === 429) return 'The notetaker service is busy. Try again in a minute.';
    if (e.status === 401 || e.status === 403) return 'The notetaker service rejected this server’s key.';
  }
  return 'The notetaker service did not respond. Try again in a minute.';
}

export interface RecallStatusChange {
  code: string;
  sub_code: string | null;
  created_at: string;
}

interface MediaShortcut {
  data?: { download_url?: string | null } | null;
}

export interface RecallBot {
  id: string;
  meeting_url: unknown;
  status_changes: RecallStatusChange[];
  recordings?: {
    id: string;
    started_at?: string | null;
    media_shortcuts?: { video_mixed?: MediaShortcut | null; audio_mixed?: MediaShortcut | null } | null;
  }[];
}

/* ----------------------------- bot operations ----------------------------- */

export async function createBot(params: {
  meetingUrl: string;
  botName: string;
  callId: string;
  /** JPEG shown on the bot's video tile; omitted when the banner setting is off. */
  bannerJpeg?: Buffer | null;
  /** Chat message posted on join; omitted when the banner setting is off. */
  joinMessage?: string | null;
}): Promise<{ id: string }> {
  if (!RECALL_LIVE) throw new NotetakerUnavailableError();

  const body: Record<string, unknown> = {
    meeting_url: params.meetingUrl,
    bot_name: params.botName.slice(0, 100),
    metadata: { call_id: params.callId },
    recording_config: {
      video_mixed_layout: 'speaker_view',
      start_recording_on: 'participant_join',
    },
    automatic_leave: {
      waiting_room_timeout: 600,
      noone_joined_timeout: 900,
    },
  };
  if (params.bannerJpeg) {
    const img = { kind: 'jpeg', b64_data: params.bannerJpeg.toString('base64') };
    body.automatic_video_output = { in_call_recording: img, in_call_not_recording: img };
  }
  if (params.joinMessage) {
    body.chat = { on_bot_join: { send_to: 'everyone', message: params.joinMessage } };
  }
  const bot = await recall<RecallBot>('/bot/', { method: 'POST', body: JSON.stringify(body) });
  return { id: bot.id };
}

export async function getBot(botId: string): Promise<RecallBot> {
  if (!RECALL_LIVE) throw new NotetakerUnavailableError();
  return recall<RecallBot>(`/bot/${botId}/`);
}

/** Remove the bot from the call. Recording so far is kept and finalized. */
export async function removeBot(botId: string): Promise<void> {
  if (!RECALL_LIVE) throw new NotetakerUnavailableError();
  try {
    await recall(`/bot/${botId}/leave_call/`, { method: 'POST' });
  } catch (e) {
    // 400/409 = bot already left or never joined; treat as done.
    if (e instanceof RecallError && (e.status === 400 || e.status === 409)) return;
    throw e;
  }
}

/**
 * Fresh, short-lived download URL for the finished recording. Fetched on
 * demand because Recall's signed URLs expire (architecture.md §3.1 step 5).
 */
export async function getRecordingUrl(botId: string): Promise<{ url: string; kind: 'video' | 'audio' } | null> {
  if (!RECALL_LIVE) return null;
  const bot = await getBot(botId);
  const rec = bot.recordings?.find((r) => r.media_shortcuts);
  const video = rec?.media_shortcuts?.video_mixed?.data?.download_url;
  if (video) return { url: video, kind: 'video' };
  const audio = rec?.media_shortcuts?.audio_mixed?.data?.download_url;
  if (audio) return { url: audio, kind: 'audio' };
  return null;
}

/** Permanently delete a bot's recordings at Recall (account deletion). */
export async function deleteBotMedia(botId: string): Promise<void> {
  if (!RECALL_LIVE) return;
  try {
    await recall(`/bot/${botId}/delete_media/`, { method: 'POST' });
  } catch (e) {
    // 404: the bot or its media is already gone.
    if (e instanceof RecallError && e.status === 404) return;
    throw e;
  }
}

/** When the bot's recording file actually starts (media t=0), if known. */
export async function getRecordingStart(botId: string): Promise<string | null> {
  if (!RECALL_LIVE) return null;
  const bot = await getBot(botId);
  return bot.recordings?.find((r) => r.started_at)?.started_at ?? null;
}

/* -------------------------- lifecycle → call status ------------------------- */

export type BotTransition =
  | { kind: 'status'; status: 'joining' | 'waiting_admit' | 'recording'; recordingStartedAt?: string }
  | { kind: 'ended'; reason: string | null }
  | { kind: 'done' }
  | { kind: 'fatal'; reason: string };

/** Human-readable failure reasons for Recall sub codes (PRD FR-3.2). */
const REASONS: Record<string, string> = {
  timeout_exceeded_waiting_room: 'The notetaker was not admitted from the waiting room in time.',
  call_ended_by_platform_waiting_room_timeout:
    'The notetaker was not admitted before the meeting platform’s waiting-room limit.',
  bot_kicked_from_waiting_room: 'The host declined the notetaker in the waiting room.',
  bot_kicked_from_call: 'The notetaker was removed from the meeting by the host.',
  call_ended_by_host: 'The host ended the meeting.',
  meeting_not_started: 'The meeting had not started yet.',
  timeout_exceeded_noone_joined: 'Nobody joined the meeting, so the notetaker left.',
  timeout_exceeded_everyone_left: 'Everyone left the meeting.',
  timeout_exceeded_in_call_not_recording: 'The notetaker was never allowed to record.',
  timeout_exceeded_recording_permission_denied: 'The host denied recording permission.',
  recording_permission_denied: 'The host denied recording permission.',
  meeting_not_found: 'No meeting was found at that link.',
  meeting_ended: 'The meeting had already ended.',
  bot_errored: 'The notetaker ran into an unexpected error.',
  failed_to_launch_in_time: 'The notetaker took too long to launch. Try again.',
  bot_received_leave_call: 'The notetaker was removed before recording started.',
  meeting_link_expired: 'The meeting link has expired.',
  meeting_link_invalid: 'The meeting link is invalid.',
  meeting_password_incorrect: 'The meeting password in the link is incorrect.',
  meeting_requires_registration: 'The meeting requires registration, which the notetaker can’t complete.',
  meeting_requires_sign_in: 'The meeting only allows signed-in users.',
  zoom_meeting_not_accessible: 'The Zoom meeting isn’t accessible to external participants.',
};

export function failureReason(
  subCode: string | null | undefined,
  fallback = 'The notetaker could not record this meeting.',
): string {
  return (subCode && REASONS[subCode]) || fallback;
}

/**
 * Map a Recall status code (webhook `bot.<code>` or a bot's status_changes[])
 * onto our call status machine. Unknown / informational codes return null.
 */
export function mapBotCode(code: string, subCode: string | null, at: string): BotTransition | null {
  switch (code.replace(/^bot\./, '')) {
    case 'joining_call':
      return { kind: 'status', status: 'joining' };
    case 'in_waiting_room':
      return { kind: 'status', status: 'waiting_admit' };
    case 'in_call_not_recording':
    case 'recording_permission_allowed':
      return { kind: 'status', status: 'joining' };
    case 'in_call_recording':
      return { kind: 'status', status: 'recording', recordingStartedAt: at };
    case 'recording_permission_denied':
      return { kind: 'ended', reason: failureReason('recording_permission_denied') };
    case 'call_ended':
      return { kind: 'ended', reason: subCode ? failureReason(subCode) : null };
    case 'done':
      return { kind: 'done' };
    case 'fatal':
      return { kind: 'fatal', reason: failureReason(subCode) };
    default:
      return null;
  }
}

/* ------------------------------ webhook auth ------------------------------ */

/**
 * Verify a Recall (Svix-format) webhook: HMAC-SHA256 over
 * `${id}.${timestamp}.${rawBody}` with the base64 key after `whsec_`,
 * compared timing-safely against every `v1,<sig>` in the header. Rejects
 * timestamps more than 5 minutes off to block replays.
 */
export function verifyRecallWebhook(headers: Headers, rawBody: string, secret: string | undefined): boolean {
  if (!secret) return false;
  const id = headers.get('webhook-id') ?? headers.get('svix-id');
  const ts = headers.get('webhook-timestamp') ?? headers.get('svix-timestamp');
  const sigHeader = headers.get('webhook-signature') ?? headers.get('svix-signature');
  if (!id || !ts || !sigHeader) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest();
  return sigHeader.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) return false;
    const got = Buffer.from(sig, 'base64');
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
