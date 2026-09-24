import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildAccountContext, streamAnswer } from '@/lib/ai/ask';
import { checkRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

const bodySchema = z.object({
  question: z.string().min(1).max(1000),
  scope: z.enum(['mine', 'team']).default('mine'),
});

/** Account-level Ask Fathom (architecture.md §4.2), streamed. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(supabase, user.id, 'ask', 20);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many questions at once. Wait a minute and try again.' },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { context, citations } = await buildAccountContext(supabase, parsed.data.question);
  const stream = await streamAnswer({
    question: parsed.data.question,
    context,
    scopeLabel: parsed.data.scope === 'team' ? 'Team Calls' : 'My Calls',
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Citations': encodeURIComponent(JSON.stringify(citations.slice(0, 8))),
    },
  });
}
