import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncBot, BOT_ACTIVE } from '@/lib/bot/lifecycle';
import { describeFailure } from '@/lib/pipeline/errors';
import type { CallStatus } from '@/lib/types';

// A `done` found by polling starts transcription after the reply.
export const maxDuration = 300;

/**
 * The call page, the overlay and My Calls can all poll the same call. Ask
 * Recall at most once per call every few seconds; webhooks still apply
 * changes immediately.
 */
const lastSync = new Map<string, number>();
function shouldSync(callId: string): boolean {
  const now = Date.now();
  if (now - (lastSync.get(callId) ?? 0) < 5000) return false;
  lastSync.set(callId, now);
  if (lastSync.size > 500) for (const [k, t] of lastSync) if (now - t > 60_000) lastSync.delete(k);
  return true;
}

const COLS = 'id, status, source, bot_id, error, failed_stage, recording_started_at';

/**
 * Live status for polling (PRD FR-3.2). For an active bot call it first pulls
 * the bot's state from the provider, so the lifecycle advances even where
 * webhooks can't reach this deployment. Clients poll only while active.
 */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let { data: call } = await supabase.from('calls').select(COLS).eq('id', id).maybeSingle();
  if (!call) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (call.source === 'bot' && call.bot_id && BOT_ACTIVE.includes(call.status as CallStatus) && shouldSync(id)) {
    try {
      await syncBot(createAdminClient(), id, (fn) => after(fn));
      ({ data: call } = await supabase.from('calls').select(COLS).eq('id', id).maybeSingle());
    } catch {
      // Provider hiccup: report the last known status; the next poll retries.
    }
  }
  return NextResponse.json({
    status: call!.status,
    // Bot failure reasons are already written for people; pipeline errors
    // are raw provider text, so only their plain description goes out.
    error:
      call!.status !== 'failed'
        ? null
        : call!.failed_stage === 'bot'
          ? call!.error
          : describeFailure(call!.failed_stage, call!.error).cause,
    failedStage: call!.failed_stage,
    recordingStartedAt: call!.recording_started_at,
  });
}
