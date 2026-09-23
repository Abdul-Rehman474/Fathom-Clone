'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const settingsSchema = z.object({
  bot_name: z.string().max(120).optional(),
  auto_record: z.string().optional(),
  auto_share: z.string().optional(),
  auto_action_items: z.boolean().optional(),
  default_template: z.string().optional(),
  recording_banner: z.boolean().optional(),
  auto_consent: z.boolean().optional(),
  default_share_access: z.enum(['link', 'workspace', 'private']).optional(),
  in_meeting_chat: z.boolean().optional(),
  anonymized_data: z.boolean().optional(),
  zoom_auto_unscheduled: z.boolean().optional(),
  meet_auto_unscheduled: z.boolean().optional(),
  enhanced_recording: z.boolean().optional(),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateSettings(patch: z.infer<typeof settingsSchema>) {
  const parsed = settingsSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'unauthorized' };
  const { error } = await supabase.from('user_settings').update(parsed.data).eq('user_id', user.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ------------------------------ Highlight tags ------------------------------ */

export async function addTag(name: string, color: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  const { count } = await supabase
    .from('highlight_tags')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  await supabase.from('highlight_tags').insert({
    user_id: user.id,
    name: z.string().min(1).max(60).parse(name),
    color: z.string().max(9).parse(color),
    position: count ?? 0,
  });
  revalidatePath('/settings');
  return { ok: true };
}

export async function updateTag(id: string, patch: { name?: string; color?: string }) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  await supabase.from('highlight_tags').update(patch).eq('id', id).eq('user_id', user.id);
  revalidatePath('/settings');
  return { ok: true };
}

export async function deleteTag(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  await supabase.from('highlight_tags').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/settings');
  return { ok: true };
}

export async function moveTag(id: string, direction: 'up' | 'down') {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  const { data: tags } = await supabase
    .from('highlight_tags')
    .select('id, position')
    .eq('user_id', user.id)
    .order('position');
  if (!tags) return { ok: false };
  const idx = tags.findIndex((t) => t.id === id);
  const swap = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= tags.length) return { ok: true };
  await Promise.all([
    supabase.from('highlight_tags').update({ position: tags[swap].position }).eq('id', tags[idx].id),
    supabase.from('highlight_tags').update({ position: tags[idx].position }).eq('id', tags[swap].id),
  ]);
  revalidatePath('/settings');
  return { ok: true };
}

/* ------------------------------ Integrations ------------------------------- */

export async function disconnectIntegration(provider: 'google' | 'zoom') {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  await supabase.from('integrations').delete().eq('user_id', user.id).eq('provider', provider);
  revalidatePath('/settings');
  return { ok: true };
}
