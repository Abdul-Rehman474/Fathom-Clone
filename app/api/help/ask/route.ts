import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getAnthropic, MODEL_FAST } from '@/lib/ai/client';
import { FAQ, faqContext } from '@/lib/faq';

const bodySchema = z.object({ question: z.string().min(1).max(500) });

/** FAQ-grounded help bot (UI.md §4.4). Uses Haiku when configured, else a
 *  keyword match against the FAQ. */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { question } = parsed.data;

  const anthropic = getAnthropic();
  if (!anthropic) {
    // Keyword match fallback.
    const q = question.toLowerCase();
    const best =
      FAQ.find((f) => q.split(/\W+/).some((w) => w.length > 3 && f.q.toLowerCase().includes(w))) ??
      FAQ[0];
    return NextResponse.json({ answer: best.a });
  }

  const msg = await anthropic.messages.create({
    model: MODEL_FAST,
    max_tokens: 400,
    system: `You are the Fathom support bot. Answer only from this FAQ; if it isn't covered, say you'll open a ticket.\n\n${faqContext()}`,
    messages: [{ role: 'user', content: question }],
  });
  const answer = msg.content.find((c) => c.type === 'text')?.text ?? FAQ[0].a;
  return NextResponse.json({ answer });
}
