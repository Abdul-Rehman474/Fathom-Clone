import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeNotetaker, sendNotetaker, syncBot, BOT_ACTIVE } from '@/lib/bot/lifecycle';
import type { CallStatus } from '@/lib/types';

async function ownedBotCall(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const { data: call } = await supabase
    .from('calls')
    .select('id, owner_id, source, status, bot_id, meeting_url')
    .eq('id', id)
    .maybeSingle();
  if (!call || call.owner_id !== user.id || call.source !== 'bot') {
    return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  }
  return { call };
}

/** Send (or re-send) the notetaker to this call's meeting link. */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { call, error } = await ownedBotCall(id);
  if (error) return error;
  if (!call.meeting_url) return NextResponse.json({ error: 'no_link' }, { status: 400 });
  if (['joining', 'waiting_admit', 'recording'].includes(call.status)) {
    return NextResponse.json({ error: 'already_active' }, { status: 409 });
  }
  try {
    await sendNotetaker(createAdminClient(), id);
  } catch (e) {
    return NextResponse.json(
      { error: 'send_failed', message: e instanceof Error ? e.message.slice(0, 200) : 'failed' },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, status: 'joining' });
}

/** Remove the notetaker from the meeting; what was recorded is processed (FR-3.6). */
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { call, error } = await ownedBotCall(id);
  if (error) return error;
  if (!call.bot_id || !BOT_ACTIVE.includes(call.status as CallStatus)) {
    return NextResponse.json({ error: 'not_active' }, { status: 409 });
  }
  const db = createAdminClient();
  try {
    await removeNotetaker(db, id);
  } catch (e) {
    return NextResponse.json(
      { error: 'remove_failed', message: e instanceof Error ? e.message.slice(0, 200) : 'failed' },
      { status: 502 },
    );
  }
  await syncBot(db, id, (fn) => after(fn)).catch(() => {});
  return NextResponse.json({ ok: true });
}
