import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { groqChat, hasLLM, MODEL_FAST } from '@/lib/ai/client';
import { FAQ, faqContext } from '@/lib/faq';

const bodySchema = z.object({ question: z.string().min(1).max(500) });

/** FAQ-grounded help bot (UI.md §4.4). Uses Haiku when configured, else a
 *  keyword match against the FAQ. */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { question } = parsed.data;

  if (!hasLLM()) {
    // Keyword match fallback.
    const q = question.toLowerCase();
    const best =
      FAQ.find((f) => q.split(/\W+/).some((w) => w.length > 3 && f.q.toLowerCase().includes(w))) ??
      FAQ[0];
    return NextResponse.json({ answer: best.a });
  }

  const answer = await groqChat({
    model: MODEL_FAST,
    maxTokens: 400,
    messages: [
      {
        role: 'system',
        content: `You are the Fathom support bot. Answer only from this FAQ; if it isn't covered, say you'll open a ticket.\n\n${faqContext()}`,
      },
      { role: 'user', content: question },
    ],
  });
  return NextResponse.json({ answer: answer || FAQ[0].a });
}
