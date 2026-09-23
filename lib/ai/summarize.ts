import 'server-only';
import { getAnthropic, MODEL_SUMMARY, wrapTranscript } from '@/lib/ai/client';
import { summarySchema, summaryToolInputSchema, type SummaryOutput } from '@/lib/ai/schemas';
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

/**
 * Summarize a transcript into the structured schema (architecture.md §4.1).
 * Uses Claude tool-use with one retry on validation failure; falls back to a
 * deterministic mock when no key / MOCK_PROVIDERS.
 */
export async function summarizeCall(
  segments: SegmentInput[],
  template: string,
): Promise<{ summary: SummaryOutput; model: string }> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return { summary: mockSummary(segmentsToUtterances(segments)), model: 'mock' };
  }

  const system = `You are an expert meeting analyst. Summarize the meeting into the provided tool schema. ${templateInstruction(
    template,
  )} Use the [m:ss] timestamps from the transcript to set start_ms (milliseconds) on bullets, decisions and action items where a moment is identifiable, otherwise null. Assign action items to the speaker who owns them when clear.`;

  const content = wrapTranscript(transcriptText(segments));

  async function attempt(extra?: string): Promise<SummaryOutput> {
    const msg = await anthropic!.messages.create({
      model: MODEL_SUMMARY,
      max_tokens: 4096,
      system,
      tools: [
        {
          name: 'emit_summary',
          description: 'Emit the structured meeting summary.',
          input_schema: summaryToolInputSchema as never,
        },
      ],
      tool_choice: { type: 'tool', name: 'emit_summary' },
      messages: [{ role: 'user', content: extra ? `${content}\n\n${extra}` : content }],
    });
    const block = msg.content.find((c) => c.type === 'tool_use');
    if (!block || block.type !== 'tool_use') throw new Error('No tool_use in response');
    return summarySchema.parse(block.input);
  }

  try {
    return { summary: await attempt(), model: MODEL_SUMMARY };
  } catch (err) {
    // One retry with the validation error appended.
    const summary = await attempt(
      `The previous output failed validation: ${err instanceof Error ? err.message : String(err)}. Return valid data matching the schema exactly.`,
    );
    return { summary, model: MODEL_SUMMARY };
  }
}
