import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/time';
import { createPlaylist } from '@/app/(app)/playlists/actions';
import { Button } from '@/components/ui/button';
import { PageHeading, EmptyState } from '@/components/ui/page-heading';

export const metadata = { title: 'Playlists' };

function NewPlaylistButton() {
  return (
    <form action={createPlaylist}>
      <input type="hidden" name="title" value="New playlist" />
      <Button type="submit">
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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="Library"
        title="Playlists"
        description="Group highlights from different calls to share for feedback or training."
        actions={<NewPlaylistButton />}
      />

      {!playlists || playlists.length === 0 ? (
        <EmptyState
          label="No playlists yet"
          title="Create shareable playlists of highlights"
          body="Organize feedback across meetings, build training libraries of key moments, and share customer testimonials."
          action={<NewPlaylistButton />}
        />
      ) : (
        <div className="border-t border-border">
          {playlists.map((p) => {
            const count = (p as { playlist_items: { count: number }[] }).playlist_items?.[0]?.count ?? 0;
            return (
              <Link
                key={p.id}
                href={`/playlists/${p.id}`}
                className="group flex items-center justify-between gap-6 border-b border-border py-5 transition-transform duration-200 hover:translate-x-0.5"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold group-hover:text-lime">{p.title}</h2>
                  {p.description && <p className="mt-1 truncate text-sm text-text-3">{p.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-6 text-sm text-text-3 tnum">
                  <span>
                    <span className="text-off-white">{count}</span> highlight{count === 1 ? '' : 's'}
                  </span>
                  <span className="hidden sm:inline">Updated {formatDate(p.updated_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
