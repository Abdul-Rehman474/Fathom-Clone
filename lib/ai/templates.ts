import type { SummaryTemplate } from '@/lib/config';

/** Template-specific instructions for the summarizer (architecture.md §4.1). */
export const TEMPLATE_INSTRUCTIONS: Record<SummaryTemplate, string> = {
  general:
    'Produce a balanced general-purpose summary. Give equal weight to decisions, action items and open questions.',
  sales:
    'This is a sales call. Emphasise the prospect’s pain points, objections raised, budget/authority/need signals, competitors mentioned, and concrete next steps to advance the deal.',
  customer_success:
    'This is a customer-success call. Emphasise account health, risks and blockers, feature requests, commitments made to the customer, and renewal/expansion signals.',
  one_on_one:
    'This is a 1:1. Emphasise personal updates, blockers, feedback given and received, growth topics, and follow-ups each person owns.',
  standup:
    'This is a stand-up. Keep it terse: what’s done, what’s next, and blockers per person. Action items should map to owners.',
  interview:
    'This is an interview. Emphasise the candidate’s strengths and concerns, answers to key questions, signals for/against, and recommended next steps.',
};

export function templateInstruction(template: string): string {
  return (
    TEMPLATE_INSTRUCTIONS[template as SummaryTemplate] ?? TEMPLATE_INSTRUCTIONS.general
  );
}
