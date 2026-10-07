'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, ArrowLeft, X, Play, Share2, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/toaster';
import { msToClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { removeFromPlaylist, moveItem, deletePlaylist, renamePlaylist, setPlaylistShare } from '@/app/(app)/playlists/actions';

export interface Clip {
  highlightId: string;
  callId: string;
  callTitle: string;
  startMs: number;
  endMs: number | null;
  note: string | null;
  color: string;
}

export function PlaylistDetail(props: {
  id: string;
  title: string;
  description: string | null;
  shareToken: string | null;
  clips: Clip[];
}) {
  const { id, title, shareToken, clips } = props;
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const [playAll, setPlayAll] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [name, setName] = useState(title);

  const current = clips[active];

  // Load the active clip's media.
  useEffect(() => {
    if (!current) return;
    let ok = true;
    fetch(`/api/calls/${current.callId}/media`)
      .then((r) => r.json())
      .then((d) => {
        if (!ok) return;
        setMediaUrl(d.url);
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, [current]);

  // When media loads, seek to the clip start.
  useEffect(() => {
    const v = videoRef.current;
    if (v && mediaUrl && current) {
      const onLoaded = () => {
        v.currentTime = current.startMs / 1000;
        v.play().catch(() => {});
      };
      v.addEventListener('loadedmetadata', onLoaded, { once: true });
      return () => v.removeEventListener('loadedmetadata', onLoaded);
    }
  }, [mediaUrl, current]);

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !current?.endMs) return;
    if (v.currentTime * 1000 >= current.endMs) {
      if (playAll && active < clips.length - 1) setActive((a) => a + 1);
      else v.pause();
    }
  }

  if (clips.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-text-2">This playlist has no clips yet. Add highlights from a call’s Highlights panel.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/playlists" className="mb-6 inline-flex items-center gap-2 text-sm text-text-3 transition-colors hover:text-lime">
        <ArrowLeft className="size-4" /> All playlists
      </Link>
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        {editingTitle ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={async () => {
              setEditingTitle(false);
              await renamePlaylist(id, name);
              router.refresh();
            }}
            className="max-w-sm"
          />
        ) : (
          <button onClick={() => setEditingTitle(true)}>
            <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          </button>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setActive(0); setPlayAll(true); }}>
            <Play /> Play all
          </Button>
          <SharePopover id={id} shareToken={shareToken} />
          <Button
            variant="danger"
            size="icon"
            aria-label="Delete playlist"
            onClick={async () => {
              await deletePlaylist(id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="self-start overflow-hidden rounded-frame border border-border">
          {mediaUrl ? (
            <video ref={videoRef} src={mediaUrl} controls className="aspect-video w-full bg-black" onTimeUpdate={onTimeUpdate} />
          ) : null}
          <div className="bg-carbon-soft px-5 py-4">
            <p className="micro-label mb-2">Now selected</p>
            <p className="font-display text-lg font-semibold">{current.note ?? 'Highlight'}</p>
            <p className="mt-1 text-sm text-text-3 tnum">
              {current.callTitle} · <span className="font-mono text-lime">{msToClock(current.startMs)}</span>
            </p>
            {!mediaUrl && (
              <p className="mt-3 text-sm text-text-3">This clip’s call has no recording attached, so there’s nothing to play.</p>
            )}
            <Link href={`/calls/${current.callId}`} className="mt-4 inline-block text-sm text-lime hover:underline">
              Open the call →
            </Link>
          </div>
        </div>

        <ol className="border-t border-border">
          {clips.map((c, i) => (
            <li
              key={c.highlightId}
              className={cn(
                'group flex items-center gap-3 border-b border-l-2 border-b-border py-3 pl-3 pr-1 transition-colors',
                i === active ? 'border-l-lime bg-white/[0.03]' : 'border-l-transparent hover:bg-white/[0.02]',
              )}
            >
              <span className="size-3 shrink-0 rounded-[3px]" style={{ backgroundColor: c.color }} />
              <button className="flex-1 text-left" onClick={() => { setActive(i); setPlayAll(false); }}>
                <div className="text-sm font-medium">{c.note ?? 'Highlight'}</div>
                <div className="text-xs text-text-3">
                  {c.callTitle} · {msToClock(c.startMs)}
                </div>
              </button>
              <div className="flex flex-col lg:opacity-0 lg:group-hover:opacity-100">
                <button disabled={i === 0} onClick={async () => { await moveItem(id, c.highlightId, 'up'); router.refresh(); }} className="text-text-3 hover:text-off-white disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="size-3.5" />
                </button>
                <button disabled={i === clips.length - 1} onClick={async () => { await moveItem(id, c.highlightId, 'down'); router.refresh(); }} className="text-text-3 hover:text-off-white disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              <button onClick={async () => { await removeFromPlaylist(id, c.highlightId); router.refresh(); }} className="text-text-3 hover:text-danger" aria-label="Remove from playlist">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SharePopover({ id, shareToken }: { id: string; shareToken: string | null }) {
  const router = useRouter();
  const [token, setToken] = useState(shareToken);
  const link = typeof window !== 'undefined' && token ? `${window.location.origin}/share/playlist/${token}` : '';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          <Share2 /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2">
        {token ? (
          <>
            <div className="flex gap-2">
              <Input readOnly value={link} className="text-xs" />
              <Button size="sm" onClick={() => { navigator.clipboard.writeText(link); toast.success('Copied'); }}>
                <Copy className="size-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={async () => { const r = await setPlaylistShare(id, false); setToken(r.token); router.refresh(); }}>
              Stop sharing
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full" onClick={async () => { const r = await setPlaylistShare(id, true); setToken(r.token); router.refresh(); }}>
            Create share link
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
