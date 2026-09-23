import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildCallContext, streamAnswer } from '@/lib/ai/ask';
import { checkRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

const bodySchema = z.object({ question: z.string().min(1).max(1000) });

/** Per-call Ask Fathom (architecture.md §4.2), streamed with [m:ss] citations. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(supabase, user.id, 'ask', 20);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { context, title } = await buildCallContext(supabase, id);
  const stream = await streamAnswer({
    question: parsed.data.question,
    context,
    scopeLabel: title,
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
