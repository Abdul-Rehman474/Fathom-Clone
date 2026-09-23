/** Global product config. Keep brand naming in one place (designPlan.md §8). */
export const BRAND_NAME = 'FATHOM';

/** Upload size ceiling, enforced client-side (Supabase free plan: 50 MB/file). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Accepted upload media types (PRD FR-3.5). */
export const ACCEPTED_UPLOAD_EXT = ['mp3', 'wav', 'm4a', 'webm', 'mp4'] as const;

/** Summary templates (architecture.md §4.1). */
export const SUMMARY_TEMPLATES = [
  'general',
  'sales',
  'customer_success',
  'one_on_one',
  'standup',
  'interview',
] as const;
export type SummaryTemplate = (typeof SUMMARY_TEMPLATES)[number];

export const TEMPLATE_LABELS: Record<SummaryTemplate, string> = {
  general: 'General',
  sales: 'Sales',
  customer_success: 'Customer Success',
  one_on_one: '1:1',
  standup: 'Stand-up',
  interview: 'Interview',
};

/** Default highlight tags seeded per user (architecture.md §5). */
export const DEFAULT_HIGHLIGHT_TAGS = [
  { name: 'Highlight', color: '#00B8F5' },
  { name: 'Positive Reaction', color: '#22C55E' },
  { name: 'Needs Review', color: '#FACC15' },
  { name: 'Feedback', color: '#FF7A1A' },
] as const;

/** Whether provider clients return fixture data instead of calling live APIs. */
export const MOCK_PROVIDERS =
  process.env.MOCK_PROVIDERS === 'true' || process.env.MOCK_PROVIDERS === '1';
