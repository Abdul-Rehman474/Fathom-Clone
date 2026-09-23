import Link from 'next/link';
import { ListVideo, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/time';
import { createPlaylist } from '@/app/(app)/playlists/actions';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Playlists' };

function NewPlaylistButton() {
  return (
    <form action={createPlaylist}>
      <input type="hidden" name="title" value="New playlist" />
      <Button type="submit" size="sm">
        <Plus /> New playlist
      </Button>
    </form>
  );
}

export default async function PlaylistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, title, description, updated_at, playlist_items(count)')
    .eq('owner_id', user?.id ?? '')
    .order('updated_at', { ascending: false });

  if (!playlists || playlists.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-3">Playlists</p>
        <h1 className="mt-2 text-2xl font-semibold">Create shareable playlists of highlights</h1>
        <p className="mt-3 text-text-2">
          Playlists let you save highlights from your calls into organized collections that are easy to share.
        </p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-gold">
          <li>✓ Organize feedback across multiple meetings</li>
          <li>✓ Create training libraries of key moments</li>
          <li>✓ Share customer testimonials</li>
        </ul>
        <div className="mt-8 flex justify-center">
          <NewPlaylistButton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Playlists</h1>
        <NewPlaylistButton />
      </div>
      {playlists.map((p) => {
        const count = (p as { playlist_items: { count: number }[] }).playlist_items?.[0]?.count ?? 0;
        return (
          <Link
            key={p.id}
            href={`/playlists/${p.id}`}
            className="flex items-center gap-3 rounded-card border border-border bg-surface-1 p-4 hover:bg-surface-2"
          >
            <ListVideo className="size-5 text-cyan" />
            <div className="flex-1">
              <div className="font-semibold">{p.title}</div>
              <div className="text-xs text-text-3">
                {count} highlight{count === 1 ? '' : 's'} · Updated {formatDate(p.updated_at)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
