import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { BrandMark } from '@/components/brand';
import { Pill } from '@/components/ui/button';
import { msToClock } from '@/lib/time';

export const metadata = { title: 'Shared playlist' };

export default async function SharePlaylistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: playlist } = await admin
    .from('playlists')
    .select('id, title, description')
    .eq('share_token', token)
    .maybeSingle();

  if (!playlist) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-app text-center">
        <BrandMark href="/" />
        <p className="text-lg font-semibold">This playlist is no longer available</p>
        <Link href="/" className="text-cyan hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const { data: items } = await admin
    .from('playlist_items')
    .select('position, highlights(id, call_id, start_ms, note)')
    .eq('playlist_id', playlist.id)
    .order('position');
  const clips = (items ?? [])
    .map((i) => (i as unknown as { highlights: { id: string; call_id: string; start_ms: number; note: string | null } }).highlights)
    .filter(Boolean);
  const callIds = [...new Set(clips.map((c) => c.call_id))];
  const { data: calls } = await admin
    .from('calls')
    .select('id, title')
    .in('id', callIds.length ? callIds : ['00000000-0000-0000-0000-000000000000']);
  const callTitle = new Map((calls ?? []).map((c) => [c.id, c.title]));

  return (
    <div className="min-h-screen bg-bg-app">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <BrandMark />
          <span className="text-sm text-text-3">{playlist.title} · Shared playlist</span>
        </div>
        <Link href="/signup">
          <Pill className="h-10 px-6 text-sm">Sign up free</Pill>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold">{playlist.title}</h1>
        {playlist.description && <p className="mt-1 text-text-2">{playlist.description}</p>}
        <ol className="mt-6 space-y-2">
          {clips.map((c) => (
            <li key={c.id} className="rounded-card border border-border bg-surface-1 p-4">
              <div className="text-sm font-medium">{c.note ?? 'Highlight'}</div>
              <div className="text-xs text-text-3 tnum">
                {callTitle.get(c.call_id) ?? 'Call'} · {msToClock(c.start_ms)}
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
