'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  kind: z.enum(['ticket', 'feedback']),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
});

/** Save a support ticket or feedback (PRD FR-6.13, §20). */
export async function submitFeedback(input: {
  kind: 'ticket' | 'feedback';
  subject?: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please write a message.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    kind: parsed.data.kind,
    subject: parsed.data.subject ?? null,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
