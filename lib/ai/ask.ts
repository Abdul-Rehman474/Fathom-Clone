import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { groqStream, hasLLM, MODEL_SUMMARY, wrapTranscript } from '@/lib/ai/client';
import { searchSegments, searchSummaries, groupHitsByCall } from '@/lib/search';
import { msToClock } from '@/lib/time';

export interface Citation {
  callId: string;
  title: string;
  startMs: number;
}

/** Build retrieval context for an account-level question. */
export async function buildAccountContext(
  supabase: SupabaseClient,
  question: string,
): Promise<{ context: string; citations: Citation[] }> {
  const [hits, summaries] = await Promise.all([
    searchSegments(supabase, question, 24),
    searchSummaries(supabase, question, 8),
  ]);
  const grouped = groupHitsByCall(hits).slice(0, 8);
  const citations: Citation[] = [];
  const blocks: string[] = [];
  const seen = new Set<string>();

  for (const g of grouped) {
    seen.add(g.callId);
    const lines = g.snippets
      .map((s) => {
        citations.push({ callId: g.callId, title: g.title, startMs: s.startMs });
        return `[${msToClock(s.startMs)}] ${s.text}`;
      })
      .join('\n');
    blocks.push(`Call "${g.title}" (${g.createdAt.slice(0, 10)}):\n${lines}`);
  }

  // Include summary overviews for calls matched only by summary text.
  for (const s of summaries) {
    if (seen.has(s.callId) || !s.overview) continue;
    seen.add(s.callId);
    citations.push({ callId: s.callId, title: s.title, startMs: 0 });
    blocks.push(`Call "${s.title}" (${s.createdAt.slice(0, 10)}) — summary:\n${s.overview}`);
  }

  return { context: blocks.join('\n\n'), citations };
}

/** Per-call context: full transcript + overview. */
export async function buildCallContext(
  supabase: SupabaseClient,
  callId: string,
): Promise<{ context: string; title: string }> {
  const [{ data: call }, { data: segs }, { data: summary }] = await Promise.all([
    supabase.from('calls').select('title').eq('id', callId).maybeSingle(),
    supabase.from('transcript_segments').select('speaker_label, start_ms, text').eq('call_id', callId).order('idx'),
    supabase.from('summaries').select('overview').eq('call_id', callId).maybeSingle(),
  ]);
  const transcript = (segs ?? [])
    .map((s) => `[${msToClock(s.start_ms)}] ${s.speaker_label ?? 'Speaker'}: ${s.text}`)
    .join('\n');
  const context = `${summary?.overview ? `Summary: ${summary.overview}\n\n` : ''}${transcript}`;
  return { context, title: call?.title ?? 'this call' };
}

/**
 * Stream an answer. Live mode uses Claude; mock mode returns a grounded,
 * citation-bearing answer built from the retrieved context. Returns a
 * ReadableStream of UTF-8 text.
 */
export async function streamAnswer(params: {
  question: string;
  context: string;
  scopeLabel: string;
}): Promise<ReadableStream<Uint8Array>> {
  const enc = new TextEncoder();

  if (!hasLLM() || !params.context.trim()) {
    const answer = mockAnswer(params);
    return new ReadableStream({
      async start(controller) {
        for (const word of answer.split(' ')) {
          controller.enqueue(enc.encode(word + ' '));
          await new Promise((r) => setTimeout(r, 12));
        }
        controller.close();
      },
    });
  }

  const system = `You answer questions about the user's meetings using only the provided context. Cite moments as [m:ss]. If the answer isn't in the context, say so. Scope: ${params.scopeLabel}.`;
  return groqStream({
    model: MODEL_SUMMARY,
    maxTokens: 1024,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `${wrapTranscript(params.context)}\n\nQuestion: ${params.question}` },
    ],
  });
}

function mockAnswer({ question, context }: { question: string; context: string }): string {
  const firstTs = context.match(/\[(\d+:\d{2})\]/)?.[1];
  if (!context.trim()) {
    return "I couldn't find anything in your calls about that yet. Once you have a processed call, ask again and I'll cite the exact moments.";
  }
  return `Based on your meetings: ${question.replace(/\?$/, '')} — the discussion touched on this${
    firstTs ? ` around [${firstTs}]` : ''
  }. Here's the gist drawn from the transcript context you have, with the key moment linked above. (This is a mock answer; add GROQ_API_KEY for live, reasoned responses.)`;
}
