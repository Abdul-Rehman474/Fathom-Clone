'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, X, Play, Share2, Trash2, Copy } from 'lucide-react';
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
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-text-2">This playlist has no clips yet. Add highlights from a call’s Highlights panel.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-4">
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
            <h1 className="text-2xl font-semibold">{title}</h1>
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
            onClick={async () => {
              await deletePlaylist(id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-frame border border-border bg-black">
          {mediaUrl ? (
            <video ref={videoRef} src={mediaUrl} controls className="aspect-video w-full" onTimeUpdate={onTimeUpdate} />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-text-3">
              Playback isn’t available for this clip’s recording.
            </div>
          )}
          <div className="border-t border-border bg-surface-1 px-4 py-2 text-sm text-text-2">
            {current.note ?? current.callTitle} · {msToClock(current.startMs)}
          </div>
        </div>

        <ol className="space-y-2">
          {clips.map((c, i) => (
            <li
              key={c.highlightId}
              className={cn(
                'group flex items-center gap-2 rounded-card border p-3',
                i === active ? 'border-cyan bg-surface-2' : 'border-border bg-surface-1',
              )}
            >
              <span className="size-3 shrink-0 rounded-[3px]" style={{ backgroundColor: c.color }} />
              <button className="flex-1 text-left" onClick={() => { setActive(i); setPlayAll(false); }}>
                <div className="text-sm font-medium">{c.note ?? 'Highlight'}</div>
                <div className="text-xs text-text-3">
                  {c.callTitle} · {msToClock(c.startMs)}
                </div>
              </button>
              <div className="flex flex-col opacity-0 group-hover:opacity-100">
                <button disabled={i === 0} onClick={async () => { await moveItem(id, c.highlightId, 'up'); router.refresh(); }} className="text-text-3 disabled:opacity-30">
                  <ArrowUp className="size-3.5" />
                </button>
                <button disabled={i === clips.length - 1} onClick={async () => { await moveItem(id, c.highlightId, 'down'); router.refresh(); }} className="text-text-3 disabled:opacity-30">
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              <button onClick={async () => { await removeFromPlaylist(id, c.highlightId); router.refresh(); }} className="text-text-3 hover:text-danger">
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
