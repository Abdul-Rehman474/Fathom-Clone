import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyRecallWebhook } from '@/lib/providers/recall';
import { applyBotChange } from '@/lib/bot/lifecycle';

export const maxDuration = 60;

interface RecallWebhook {
  event?: string;
  data?: { data?: { code?: string; sub_code?: string | null; updated_at?: string }; bot?: { id?: string } };
}

/**
 * Recall bot status webhooks (architecture.md §3.1). Verifies the signature
 * over the raw body, drops redelivered messages by `webhook-id`, then maps the
 * event onto the call status machine (also de-duped per bot+code+time, shared
 * with status polling).
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyRecallWebhook(request.headers, raw, process.env.RECALL_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let body: RecallWebhook;
  try {
    body = JSON.parse(raw) as RecallWebhook;
  } catch {
    return NextResponse.json({ error: 'bad_body' }, { status: 400 });
  }

  const db = createAdminClient();
  const msgId = request.headers.get('webhook-id') ?? request.headers.get('svix-id') ?? '';
  const { error: dupe } = await db.from('webhook_events').insert({ provider: 'recall_msg', event_id: msgId });
  if (dupe) return NextResponse.json({ ok: true, duplicate: true });

  const botId = body.data?.bot?.id;
  const event = body.event ?? '';
  // Only bot status events drive the lifecycle; acknowledge the rest.
  if (!botId || !event.startsWith('bot.')) return NextResponse.json({ ok: true, ignored: true });

  const applied = await applyBotChange(
    db,
    botId,
    {
      code: event.slice(4),
      sub_code: body.data?.data?.sub_code ?? null,
      created_at: body.data?.data?.updated_at ?? new Date().toISOString(),
    },
    (fn) => after(fn),
  );
  return NextResponse.json({ ok: true, duplicate: !applied });
}
