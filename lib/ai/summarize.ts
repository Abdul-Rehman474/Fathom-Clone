import 'server-only';
import { groqChat, hasLLM, MODEL_SUMMARY, wrapTranscript } from '@/lib/ai/client';
import { summarySchema, type SummaryOutput } from '@/lib/ai/schemas';
import { templateInstruction } from '@/lib/ai/templates';
import { mockSummary, type Utterance } from '@/lib/providers/mock-fixtures';
import { msToClock } from '@/lib/time';

export interface SegmentInput {
  speaker_label: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
}

/** "[m:ss] Speaker A: text" lines for the model. */
function transcriptText(segments: SegmentInput[]): string {
  return segments
    .map((s) => `[${msToClock(s.start_ms)}] ${s.speaker_label ?? 'Speaker'}: ${s.text}`)
    .join('\n');
}

function segmentsToUtterances(segments: SegmentInput[]): Utterance[] {
  return segments.map((s) => ({
    speaker: (s.speaker_label ?? 'Speaker A').charCodeAt(8) - 65 || 0,
    start: s.start_ms / 1000,
    end: s.end_ms / 1000,
    transcript: s.text,
  }));
}

const SCHEMA_HINT = `Return ONLY a JSON object with these keys:
{
  "title": string,
  "overview": string,
  "purpose": string,
  "key_takeaways": string[],
  "topics": [{ "title": string, "bullets": [{ "text": string, "start_ms": number|null }] }],
  "decisions": [{ "text": string, "start_ms": number|null }],
  "action_items": [{ "text": string, "assignee": string|null, "start_ms": number|null }],
  "next_steps": string[],
  "questions": string[]
}
start_ms is milliseconds derived from the [m:ss] timestamps; use null when no clear moment.`;

/**
 * Summarize a transcript into the structured schema (architecture.md §4.1).
 * Uses Groq JSON mode with one retry on validation failure; falls back to a
 * deterministic mock when no key / MOCK_PROVIDERS.
 */
export async function summarizeCall(
  segments: SegmentInput[],
  template: string,
): Promise<{ summary: SummaryOutput; model: string }> {
  if (!hasLLM()) {
    return { summary: mockSummary(segmentsToUtterances(segments)), model: 'mock' };
  }

  const system = `You are an expert meeting analyst. ${templateInstruction(
    template,
  )} ${SCHEMA_HINT} Assign action items to the speaker who owns them when clear. Write plain, direct sentences. Never use em dashes or en dashes.`;
  const content = wrapTranscript(transcriptText(segments));

  async function attempt(extra?: string): Promise<SummaryOutput> {
    const raw = await groqChat({
      model: MODEL_SUMMARY,
      json: true,
      maxTokens: 4096,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: extra ? `${content}\n\n${extra}` : content },
      ],
    });
    return summarySchema.parse(JSON.parse(raw));
  }

  try {
    return { summary: await attempt(), model: MODEL_SUMMARY };
  } catch (err) {
    const summary = await attempt(
      `The previous output was invalid: ${err instanceof Error ? err.message : String(err)}. Return valid JSON matching the schema exactly.`,
    );
    return { summary, model: MODEL_SUMMARY };
  }
}
