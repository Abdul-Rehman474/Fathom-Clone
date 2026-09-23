import type { SummaryOutput } from '@/lib/ai/schemas';

/** Deepgram-shaped utterance (subset we use). */
export interface Utterance {
  speaker: number; // 0,1,2…
  start: number; // seconds (float)
  end: number;
  transcript: string;
}

/**
 * A realistic multi-speaker transcript used when MOCK_PROVIDERS is on or a key
 * is absent. Scaled to fit the recording's duration so timestamps stay in range.
 */
const BASE_LINES: { speaker: number; text: string }[] = [
  { speaker: 0, text: "Thanks for joining. Let's start with a quick status on the launch and then talk through the open risks." },
  { speaker: 1, text: "Sure. Engineering is on track — the API is code-complete and we're finishing tests this week." },
  { speaker: 2, text: "On design, the onboarding flow is done and I handed the marketing screens over yesterday." },
  { speaker: 0, text: "Great. The biggest risk I see is the third-party rate limits during the launch spike. Can we cache aggressively?" },
  { speaker: 1, text: "Yes, we can cache the read paths for five minutes. I'll add that and put it behind a flag so we can tune it live." },
  { speaker: 2, text: "One thing from user testing — people miss the share button. I'd like to make it more prominent before we ship." },
  { speaker: 0, text: "Agreed. Let's make the share action primary on the call page. That's decided. Who owns it?" },
  { speaker: 2, text: "I'll own the share-button change and have it in review by Thursday." },
  { speaker: 1, text: "I'll handle the caching and the rate-limit dashboard. We should also decide the rollout percentage." },
  { speaker: 0, text: "Let's start at ten percent and double every day if error rates stay flat. Anything else? No? Thanks everyone." },
];

export function mockUtterances(durationSec: number): Utterance[] {
  const n = BASE_LINES.length;
  const span = Math.max(durationSec, 60);
  const per = span / n;
  return BASE_LINES.map((line, i) => ({
    speaker: line.speaker,
    start: +(i * per).toFixed(2),
    end: +((i + 1) * per - 0.3).toFixed(2),
    transcript: line.text,
  }));
}

/** Deterministic mock summary derived from the utterances (no LLM needed). */
export function mockSummary(utts: Utterance[]): SummaryOutput {
  const ms = (i: number) => Math.round(utts[i].start * 1000);
  return {
    title: 'Launch Readiness — Risks, Caching & Rollout',
    overview:
      'The team confirmed the launch is on track (API code-complete, design done), agreed to cache read paths behind a flag to survive third-party rate limits, decided to make the share action primary on the call page, and set a rollout starting at 10% doubling daily while error rates stay flat.',
    purpose: 'Review launch status, surface risks, and assign owners before shipping.',
    key_takeaways: [
      'Launch is on track across engineering and design.',
      'Third-party rate limits are the main launch risk; caching mitigates it.',
      'Share discoverability was the top user-testing issue.',
    ],
    topics: [
      {
        title: 'Status',
        bullets: [
          { text: 'API code-complete, tests finishing this week', start_ms: ms(1) },
          { text: 'Onboarding and marketing screens done', start_ms: ms(2) },
        ],
      },
      {
        title: 'Risks & mitigation',
        bullets: [
          { text: 'Rate limits during the launch spike', start_ms: ms(3) },
          { text: 'Cache read paths for 5 min behind a flag', start_ms: ms(4) },
        ],
      },
      {
        title: 'Rollout',
        bullets: [{ text: 'Start at 10%, double daily if errors stay flat', start_ms: ms(9) }],
      },
    ],
    decisions: [
      { text: 'Make the share action primary on the call page', start_ms: ms(6) },
      { text: 'Roll out at 10% doubling daily on stable error rates', start_ms: ms(9) },
    ],
    action_items: [
      { text: 'Make the share button prominent on the call page', assignee: 'Design', start_ms: ms(7) },
      { text: 'Add read-path caching and a rate-limit dashboard', assignee: 'Engineering', start_ms: ms(8) },
    ],
    next_steps: ['Share-button change in review by Thursday.', 'Caching flag ready before rollout.'],
    questions: ['Final rollout ceiling before going to 100%?'],
  };
}

/** Deepgram audio-intelligence "quick recap" fixture. */
export function mockDeepgramExtras() {
  return {
    short:
      'Launch-readiness meeting: status is green, caching will mitigate rate-limit risk, share button becomes primary, and rollout starts at 10% doubling daily.',
    topics: ['launch', 'caching', 'rollout'],
  };
}
