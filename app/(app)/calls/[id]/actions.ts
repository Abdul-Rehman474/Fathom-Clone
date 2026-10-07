'use server';

import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function ownedCall(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, ok: false as const };
  const { data: call } = await supabase.from('calls').select('owner_id').eq('id', id).maybeSingle();
  return { supabase, user, ok: !!call && call.owner_id === user.id };
}

export async function updateTitle(id: string, title: string) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  await supabase
    .from('calls')
    .update({ title: z.string().max(200).parse(title) })
    .eq('id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function renameSpeaker(id: string, attendeeId: string, name: string) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  const parsed = z.string().trim().min(1).max(120).safeParse(name);
  if (!parsed.success) return { ok: false };
  await supabase.from('attendees').update({ name: parsed.data }).eq('id', attendeeId).eq('call_id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function toggleActionItem(id: string, itemId: string, done: boolean) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  await supabase.from('action_items').update({ done: !!done }).eq('id', itemId).eq('call_id', id);
  return { ok: true };
}

export async function addActionItem(id: string, text: string) {
  const { supabase, ok } = await ownedCall(id);
  const parsed = z.string().trim().min(1).max(500).safeParse(text);
  if (!ok || !parsed.success) return { ok: false };
  text = parsed.data;
  const { count } = await supabase.from('action_items').select('id', { count: 'exact', head: true }).eq('call_id', id);
  await supabase.from('action_items').insert({ call_id: id, text, position: count ?? 0 });
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function deleteActionItem(id: string, itemId: string) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  await supabase.from('action_items').delete().eq('id', itemId).eq('call_id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function addHighlight(id: string, tagId: string, startMs: number, note: string) {
  const { supabase, user, ok } = await ownedCall(id);
  if (!ok || !user) return { ok: false };
  const fields = z
    .object({
      tagId: z.string().uuid(),
      startMs: z
        .number()
        .int()
        .min(0)
        .max(24 * 3600_000),
      note: z.string().max(500),
    })
    .safeParse({ tagId, startMs, note: note ?? '' });
  if (!fields.success) return { ok: false };
  // The tag must be one of the caller's own tags.
  const { data: tag } = await supabase
    .from('highlight_tags')
    .select('id')
    .eq('id', fields.data.tagId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!tag) return { ok: false };
  await supabase.from('highlights').insert({
    call_id: id,
    tag_id: tag.id,
    created_by: user.id,
    start_ms: fields.data.startMs,
    note: fields.data.note || null,
    source: 'user',
  });
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function deleteHighlight(id: string, highlightId: string) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  await supabase.from('highlights').delete().eq('id', highlightId).eq('call_id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function setShareAccess(id: string, access: 'link' | 'workspace' | 'private') {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  const patch: Record<string, unknown> = { share_access: access };
  // Ensure a token exists when sharing by link.
  const { data: call } = await supabase.from('calls').select('share_token').eq('id', id).maybeSingle();
  if (access === 'link' && !call?.share_token) {
    patch.share_token = randomBytes(16).toString('base64url');
  }
  await supabase.from('calls').update(patch).eq('id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function regenerateShareToken(id: string) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  await supabase
    .from('calls')
    .update({ share_token: randomBytes(16).toString('base64url') })
    .eq('id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function setVisibility(id: string, visibility: 'private' | 'workspace') {
  const { supabase, user, ok } = await ownedCall(id);
  if (!ok || !user) return { ok: false };
  let workspaceId: string | null = null;
  if (visibility === 'workspace') {
    const { data: m } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle();
    workspaceId = m?.workspace_id ?? null;
  }
  await supabase.from('calls').update({ visibility, workspace_id: workspaceId }).eq('id', id);
  revalidatePath(`/calls/${id}`);
  return { ok: true };
}

export async function deleteCall(id: string) {
  const { supabase, ok } = await ownedCall(id);
  if (!ok) return { ok: false };
  await supabase.from('calls').delete().eq('id', id);
  return { ok: true };
}
