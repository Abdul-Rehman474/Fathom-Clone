'use server';

import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** RLS answers this: a highlight is visible only if its call is. */
async function canSeeHighlight(supabase: Awaited<ReturnType<typeof createClient>>, highlightId: string) {
  const { data } = await supabase.from('highlights').select('id').eq('id', highlightId).maybeSingle();
  return !!data;
}

export async function createPlaylist(formData: FormData) {
  const title = z
    .string()
    .min(1)
    .max(120)
    .parse(formData.get('title') || 'New playlist');
  const { supabase, user } = await requireUser();
  if (!user) redirect('/login');
  const { data } = await supabase.from('playlists').insert({ owner_id: user.id, title }).select('id').single();
  revalidatePath('/playlists');
  if (data) redirect(`/playlists/${data.id}`);
}

export async function renamePlaylist(id: string, title: string, description?: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  const fields = z
    .object({ title: z.string().min(1).max(120), description: z.string().max(500).optional() })
    .safeParse({ title, description });
  if (!fields.success) return { ok: false };
  await supabase
    .from('playlists')
    .update({ title: fields.data.title, description: fields.data.description ?? null })
    .eq('id', id)
    .eq('owner_id', user.id);
  revalidatePath(`/playlists/${id}`);
  return { ok: true };
}

export async function deletePlaylist(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  await supabase.from('playlists').delete().eq('id', id).eq('owner_id', user.id);
  redirect('/playlists');
}

export async function addToPlaylist(playlistId: string, highlightId: string) {
  const { supabase, user } = await requireUser();
  if (!user || !(await canSeeHighlight(supabase, highlightId))) return { ok: false };
  const { count } = await supabase
    .from('playlist_items')
    .select('highlight_id', { count: 'exact', head: true })
    .eq('playlist_id', playlistId);
  await supabase
    .from('playlist_items')
    .upsert({ playlist_id: playlistId, highlight_id: highlightId, position: count ?? 0 });
  revalidatePath(`/playlists/${playlistId}`);
  return { ok: true };
}

export async function createPlaylistWithHighlight(title: string, highlightId: string) {
  const { supabase, user } = await requireUser();
  if (!user || !(await canSeeHighlight(supabase, highlightId))) return { ok: false };
  const name = z.string().min(1).max(120).safeParse(title);
  if (!name.success) return { ok: false };
  const { data } = await supabase
    .from('playlists')
    .insert({ owner_id: user.id, title: name.data })
    .select('id')
    .single();
  if (data) {
    await supabase.from('playlist_items').insert({ playlist_id: data.id, highlight_id: highlightId, position: 0 });
  }
  revalidatePath('/playlists');
  return { ok: true };
}

export async function removeFromPlaylist(playlistId: string, highlightId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  // Ownership enforced via RLS (playlist owner).
  await supabase.from('playlist_items').delete().eq('playlist_id', playlistId).eq('highlight_id', highlightId);
  revalidatePath(`/playlists/${playlistId}`);
  return { ok: true };
}

export async function moveItem(playlistId: string, highlightId: string, direction: 'up' | 'down') {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  const { data: items } = await supabase
    .from('playlist_items')
    .select('highlight_id, position')
    .eq('playlist_id', playlistId)
    .order('position');
  if (!items) return { ok: false };
  const idx = items.findIndex((i) => i.highlight_id === highlightId);
  const swap = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= items.length) return { ok: true };
  await Promise.all([
    supabase
      .from('playlist_items')
      .update({ position: items[swap].position })
      .eq('playlist_id', playlistId)
      .eq('highlight_id', items[idx].highlight_id),
    supabase
      .from('playlist_items')
      .update({ position: items[idx].position })
      .eq('playlist_id', playlistId)
      .eq('highlight_id', items[swap].highlight_id),
  ]);
  revalidatePath(`/playlists/${playlistId}`);
  return { ok: true };
}

export async function setPlaylistShare(id: string, share: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, token: null };
  const token = share ? randomBytes(16).toString('base64url') : null;
  await supabase.from('playlists').update({ share_token: token }).eq('id', id).eq('owner_id', user.id);
  revalidatePath(`/playlists/${id}`);
  return { ok: true, token };
}
