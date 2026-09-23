'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const settingsSchema = z.object({
  bot_name: z.string().max(120).optional(),
  auto_action_items: z.boolean().optional(),
  default_template: z.string().optional(),
  recording_banner: z.boolean().optional(),
  auto_consent: z.boolean().optional(),
  default_share_access: z.enum(['link', 'workspace', 'private']).optional(),
  in_meeting_chat: z.boolean().optional(),
  anonymized_data: z.boolean().optional(),
});

export async function updateSettings(patch: z.infer<typeof settingsSchema>) {
  const parsed = settingsSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };
  const { error } = await supabase.from('user_settings').update(parsed.data).eq('user_id', user.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
