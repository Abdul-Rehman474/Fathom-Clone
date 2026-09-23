import type { SupabaseClient } from '@supabase/supabase-js';
import type { SummaryContent } from '@/lib/types';

/**
 * Seeds the "Welcome to Fathom" demo call for a user (UI.md §14): a fully
 * processed call with transcript, summary, action items, highlights across all
 * tag colours, and one playlist — so the first screen is never empty.
 *
 * Idempotent: skips if the user already has a demo call.
 */

interface Seg {
  speaker: string; // A/B/C
  start_ms: number;
  end_ms: number;
  text: string;
}

const SEGMENTS: Seg[] = [
  { speaker: 'A', start_ms: 0, end_ms: 8000, text: "Welcome everyone — this is the product strategy check-in. Today I want to lock the beta scope, the pricing experiment, and who owns what before Friday." },
  { speaker: 'B', start_ms: 8000, end_ms: 20000, text: "Sounds good. On the beta, I think we should cap it at fifty workspaces so support can actually keep up. Last time we opened it wide and drowned." },
  { speaker: 'A', start_ms: 20000, end_ms: 30000, text: "Agreed, fifty is the cap. Let's treat that as decided. Sara, can you own the beta checklist and the invite copy?" },
  { speaker: 'C', start_ms: 30000, end_ms: 44000, text: "Yes, I'll own the beta checklist. I'll have a draft of the invite copy by Wednesday and the full checklist by Friday. One open question — do we gate it behind a waitlist or invite directly?" },
  { speaker: 'A', start_ms: 44000, end_ms: 52000, text: "Invite directly for the first fifty, waitlist after that. Next, pricing. The objection we keep hearing is the per-seat cost for small teams." },
  { speaker: 'B', start_ms: 52000, end_ms: 68000, text: "Right. My proposal is a flat team tier at ninety-nine a month up to ten seats. It reframes the conversation away from per-seat and the early numbers say it converts better." },
  { speaker: 'C', start_ms: 68000, end_ms: 78000, text: "I like it, but we should A/B it rather than switch everyone. Otherwise we can't tell if it's the price or the packaging doing the work." },
  { speaker: 'A', start_ms: 78000, end_ms: 90000, text: "Decision: we run a two-week A/B on the flat team tier against per-seat, starting Monday. Marcus, can you set up the experiment and the dashboard?" },
  { speaker: 'B', start_ms: 90000, end_ms: 100000, text: "I'll set up the pricing A/B and the dashboard. I'll need the final copy from Sara for the flat-tier variant by Thursday." },
  { speaker: 'A', start_ms: 100000, end_ms: 112000, text: "Good. Last thing — the onboarding drop-off. We lose about a third of new users at the connect-your-calendar step. That feels like the biggest lever right now." },
  { speaker: 'C', start_ms: 112000, end_ms: 126000, text: "I dug into that. Most of them skip it and never come back. I think we should let people finish onboarding first and prompt for calendar later, in context." },
  { speaker: 'A', start_ms: 126000, end_ms: 138000, text: "Let's do that — make the calendar step skippable and add a contextual prompt after the first recording. Sara, add it to the checklist. Anything else? No? Great, thanks everyone." },
];

const SUMMARY: SummaryContent = {
  title: 'Product Strategy — Beta Scope, Pricing & Onboarding',
  overview:
    'The team locked the beta at 50 workspaces (invite-first, then waitlist), agreed to A/B test a flat $99/month team tier against per-seat pricing for two weeks, and decided to make the calendar-connect onboarding step skippable with a contextual prompt after the first recording.',
  purpose:
    'Lock beta scope, decide the pricing experiment, and assign owners before Friday.',
  key_takeaways: [
    'Beta is capped at 50 workspaces to keep support sustainable.',
    'A flat team tier reframes the per-seat objection and is worth testing, not switching outright.',
    'Onboarding calendar-connect is the biggest current drop-off lever.',
  ],
  topics: [
    {
      title: 'Beta launch scope',
      bullets: [
        { text: 'Cap the beta at 50 workspaces', start_ms: 8000 },
        { text: 'Invite the first 50 directly, waitlist after', start_ms: 44000 },
      ],
    },
    {
      title: 'Pricing experiment',
      bullets: [
        { text: 'Flat team tier at $99/mo up to 10 seats', start_ms: 52000 },
        { text: 'A/B against per-seat for two weeks from Monday', start_ms: 78000 },
      ],
    },
    {
      title: 'Onboarding drop-off',
      bullets: [
        { text: '~1/3 of users drop at calendar-connect', start_ms: 100000 },
        { text: 'Make the step skippable; prompt later in context', start_ms: 126000 },
      ],
    },
  ],
  decisions: [
    { text: 'Beta capped at 50 workspaces, invite-first', start_ms: 20000 },
    { text: 'Run a two-week pricing A/B starting Monday', start_ms: 78000 },
    { text: 'Make calendar-connect skippable with a contextual prompt', start_ms: 126000 },
  ],
  action_items: [
    { text: 'Own the beta checklist and invite copy', assignee: 'Sara', start_ms: 30000 },
    { text: 'Draft invite copy by Wednesday', assignee: 'Sara', start_ms: 30000 },
    { text: 'Set up the pricing A/B experiment and dashboard', assignee: 'Marcus', start_ms: 90000 },
    { text: 'Deliver flat-tier variant copy by Thursday', assignee: 'Sara', start_ms: 90000 },
    { text: 'Add skippable calendar step to the checklist', assignee: 'Sara', start_ms: 126000 },
  ],
  next_steps: [
    'Sara circulates the beta checklist by Friday.',
    'Marcus launches the pricing A/B on Monday.',
  ],
  questions: ['Waitlist vs. direct invite beyond the first 50 (resolved: waitlist).'],
  deepgram: {
    short:
      'A product strategy meeting covering beta scope, a flat-tier pricing A/B, and onboarding drop-off, with owners assigned.',
    topics: ['beta launch', 'pricing', 'onboarding'],
  },
};

const ATTENDEES = [
  { name: 'You', speaker_label: 'Speaker A' },
  { name: 'Marcus', speaker_label: 'Speaker B' },
  { name: 'Sara', speaker_label: 'Speaker C' },
];

// tag name → highlight at a moment
const DEMO_HIGHLIGHTS: { tag: string; start_ms: number; note: string }[] = [
  { tag: 'Highlight', start_ms: 20000, note: 'Beta capped at 50 — decided' },
  { tag: 'Positive Reaction', start_ms: 52000, note: 'Flat team tier proposal' },
  { tag: 'Needs Review', start_ms: 78000, note: 'Pricing A/B plan to sanity-check' },
  { tag: 'Feedback', start_ms: 100000, note: 'Onboarding drop-off insight' },
];

export async function seedDemoCall(supabase: SupabaseClient, userId: string): Promise<void> {
  // Idempotency: one demo per user.
  const { data: existing } = await supabase
    .from('calls')
    .select('id')
    .eq('owner_id', userId)
    .eq('title', 'Welcome to Fathom — Product Strategy (demo)')
    .maybeSingle();
  if (existing) return;

  const duration = Math.ceil(SEGMENTS[SEGMENTS.length - 1].end_ms / 1000);

  const { data: call, error: callErr } = await supabase
    .from('calls')
    .insert({
      owner_id: userId,
      visibility: 'private',
      title: 'Welcome to Fathom — Product Strategy (demo)',
      platform: 'meet',
      source: 'bot',
      status: 'ready',
      duration_sec: duration,
      media_kind: 'audio',
      template: 'general',
      recording_started_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (callErr || !call) throw callErr ?? new Error('demo call insert failed');
  const callId = call.id as string;

  await supabase.from('attendees').insert(
    ATTENDEES.map((a) => ({ call_id: callId, name: a.name, speaker_label: a.speaker_label })),
  );

  await supabase.from('transcript_segments').insert(
    SEGMENTS.map((s, i) => ({
      call_id: callId,
      idx: i,
      speaker_label: `Speaker ${s.speaker}`,
      start_ms: s.start_ms,
      end_ms: s.end_ms,
      text: s.text,
    })),
  );

  await supabase.from('summaries').insert({
    call_id: callId,
    template: 'general',
    content: SUMMARY,
    overview: SUMMARY.overview,
    model: 'seed',
  });

  await supabase.from('action_items').insert(
    SUMMARY.action_items.map((a, i) => ({
      call_id: callId,
      text: a.text,
      assignee: a.assignee,
      start_ms: a.start_ms,
      position: i,
    })),
  );

  // Highlights: match the user's tags by name.
  const { data: tags } = await supabase
    .from('highlight_tags')
    .select('id, name')
    .eq('user_id', userId);
  const tagByName = new Map((tags ?? []).map((t) => [t.name as string, t.id as string]));
  const highlightRows = DEMO_HIGHLIGHTS.map((h) => ({
    call_id: callId,
    tag_id: tagByName.get(h.tag) ?? null,
    created_by: userId,
    start_ms: h.start_ms,
    note: h.note,
    source: 'ai' as const,
  }));
  const { data: insertedHighlights } = await supabase
    .from('highlights')
    .insert(highlightRows)
    .select('id');

  // One playlist "Best moments" from those highlights.
  const { data: playlist } = await supabase
    .from('playlists')
    .insert({ owner_id: userId, title: 'Best moments', description: 'Highlights from the demo call' })
    .select('id')
    .single();
  if (playlist && insertedHighlights?.length) {
    await supabase.from('playlist_items').insert(
      insertedHighlights.map((h, i) => ({
        playlist_id: playlist.id,
        highlight_id: h.id,
        position: i,
      })),
    );
  }
}
