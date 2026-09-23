import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlaylistDetail, type Clip } from '@/components/call/playlist-detail';

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id, title, description, share_token, owner_id')
    .eq('id', id)
    .maybeSingle();
  if (!playlist) notFound();

  const { data: items } = await supabase
    .from('playlist_items')
    .select('position, highlights(id, call_id, start_ms, end_ms, note, tag_id)')
    .eq('playlist_id', id)
    .order('position');

  const highlights = (items ?? [])
    .map((i) => (i as unknown as { highlights: { id: string; call_id: string; start_ms: number; end_ms: number | null; note: string | null; tag_id: string | null } }).highlights)
    .filter(Boolean);

  const callIds = [...new Set(highlights.map((h) => h.call_id))];
  const [{ data: calls }, { data: tags }] = await Promise.all([
    supabase.from('calls').select('id, title').in('id', callIds.length ? callIds : ['00000000-0000-0000-0000-000000000000']),
    supabase.from('highlight_tags').select('id, color'),
  ]);
  const callTitle = new Map((calls ?? []).map((c) => [c.id, c.title]));
  const tagColor = new Map((tags ?? []).map((t) => [t.id, t.color]));

  const clips: Clip[] = highlights.map((h) => ({
    highlightId: h.id,
    callId: h.call_id,
    callTitle: callTitle.get(h.call_id) ?? 'Untitled',
    startMs: h.start_ms,
    endMs: h.end_ms,
    note: h.note,
    color: (h.tag_id && tagColor.get(h.tag_id)) || '#00B8F5',
  }));

  return (
    <PlaylistDetail
      id={playlist.id}
      title={playlist.title}
      description={playlist.description}
      shareToken={playlist.share_token}
      clips={clips}
    />
  );
}
