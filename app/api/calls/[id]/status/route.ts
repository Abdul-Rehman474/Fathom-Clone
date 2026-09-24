import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncBot, BOT_ACTIVE } from '@/lib/bot/lifecycle';
import type { CallStatus } from '@/lib/types';

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

  if (call.source === 'bot' && call.bot_id && BOT_ACTIVE.includes(call.status as CallStatus)) {
    try {
      await syncBot(createAdminClient(), id, (fn) => after(fn));
      ({ data: call } = await supabase.from('calls').select(COLS).eq('id', id).maybeSingle());
    } catch {
      // Provider hiccup: report the last known status; the next poll retries.
    }
  }
  return NextResponse.json({
    status: call!.status,
    error: call!.error,
    failedStage: call!.failed_stage,
    recordingStartedAt: call!.recording_started_at,
  });
}
