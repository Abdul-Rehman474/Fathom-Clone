import { z } from 'zod';

/** Structured summary schema (architecture.md §4.1). LLM output is forced
 *  through a tool whose input matches this, then validated here. */
export const bulletSchema = z.object({
  text: z.string(),
  start_ms: z.number().nullable(),
});

export const summarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  purpose: z.string(),
  key_takeaways: z.array(z.string()),
  topics: z.array(
    z.object({
      title: z.string(),
      bullets: z.array(bulletSchema),
    }),
  ),
  decisions: z.array(bulletSchema),
  action_items: z.array(
    z.object({
      text: z.string(),
      assignee: z.string().nullable(),
      start_ms: z.number().nullable(),
    }),
  ),
  next_steps: z.array(z.string()),
  questions: z.array(z.string()),
});

export type SummaryOutput = z.infer<typeof summarySchema>;

/** JSON schema for the Anthropic tool definition (mirrors summarySchema). */
export const summaryToolInputSchema = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' },
    overview: { type: 'string' },
    purpose: { type: 'string' },
    key_takeaways: { type: 'array', items: { type: 'string' } },
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          bullets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                start_ms: { type: ['number', 'null'] },
              },
              required: ['text', 'start_ms'],
            },
          },
        },
        required: ['title', 'bullets'],
      },
    },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, start_ms: { type: ['number', 'null'] } },
        required: ['text', 'start_ms'],
      },
    },
    action_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          assignee: { type: ['string', 'null'] },
          start_ms: { type: ['number', 'null'] },
        },
        required: ['text', 'assignee', 'start_ms'],
      },
    },
    next_steps: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'title',
    'overview',
    'purpose',
    'key_takeaways',
    'topics',
    'decisions',
    'action_items',
    'next_steps',
    'questions',
  ],
};
