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
