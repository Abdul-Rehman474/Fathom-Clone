'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, Pause, Maximize, Volume2 } from 'lucide-react';
import { msToClock } from '@/lib/time';
import { cn } from '@/lib/utils';

export interface PlayerHandle {
  /** Returns false when there is no media to seek (caller can fall back). */
  seek: (ms: number) => boolean;
}

interface Marker {
  ms: number;
  color: string;
}

/** Custom media player with keyboard controls and highlight markers (UI.md §7). */
export const Player = forwardRef<
  PlayerHandle,
  {
    callId: string;
    markers?: Marker[];
    onTime?: (ms: number) => void;
  }
>(function Player({ callId, markers = [], onTime }, ref) {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    let active = true;
    fetch(`/api/calls/${callId}/media`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setUrl(d.url);
        setReady(true);
      })
      .catch(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [callId]);

  useImperativeHandle(ref, () => ({
    seek(ms: number) {
      const el = mediaRef.current;
      if (!el) return false;
      el.currentTime = ms / 1000;
      el.play().catch(() => {});
      return true;
    },
  }));

  function toggle() {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }

  function onKey(e: React.KeyboardEvent) {
    const el = mediaRef.current;
    if (!el) return;
    if (e.key === ' ') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'ArrowRight') el.currentTime += 5;
    else if (e.key === 'ArrowLeft') el.currentTime -= 5;
  }

  const noMedia = ready && !url;

  // No recording (e.g. the demo call, or media not yet available): a compact
  // notice instead of an empty 16:9 black box. Timestamps still work as
  // transcript anchors.
  if (noMedia) {
    return (
      <div className="flex items-center gap-4 rounded-card border border-border bg-carbon-soft px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-text-3">
          <Play className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-off-white">No recording attached</p>
          <p className="text-sm text-text-3">
            The transcript and summary are below. Click a timestamp to jump to that line.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-frame border border-border bg-carbon-soft" aria-busy>
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-surface-2">
          <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-lime" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-frame border border-border bg-black"
      tabIndex={0}
      onKeyDown={onKey}
      role="group"
      aria-label="Media player"
    >
      <div className="relative aspect-video bg-black">
        {url && (
          <video
            ref={mediaRef}
            src={url}
            className="h-full w-full"
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration * 1000)}
            onTimeUpdate={(e) => {
              const ms = e.currentTarget.currentTime * 1000;
              setCur(ms);
              onTime?.(ms);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}
      </div>

      {/* controls */}
      <div className="flex items-center gap-3 border-t border-border bg-surface-1 px-4 py-2">
        <button onClick={toggle} className="text-text-1" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <span className="font-mono text-xs text-text-2 tnum">{msToClock(cur)}</span>
        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={dur || 0}
            value={cur}
            onChange={(e) => {
              const el = mediaRef.current;
              if (el) el.currentTime = Number(e.target.value) / 1000;
            }}
            className="w-full accent-cyan"
            aria-label="Seek"
          />
          {dur > 0 &&
            markers.map((m, i) => (
              <span
                key={i}
                className="pointer-events-none absolute top-1/2 size-2 -translate-y-1/2 rounded-full"
                style={{ left: `${(m.ms / dur) * 100}%`, backgroundColor: m.color }}
              />
            ))}
        </div>
        <span className="font-mono text-xs text-text-3 tnum">{msToClock(dur)}</span>
        <button
          onClick={() => {
            const el = mediaRef.current;
            if (!el) return;
            const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
            el.playbackRate = next;
            setRate(next);
          }}
          className={cn('rounded-btn px-1.5 text-xs text-text-2 tnum')}
        >
          {rate}x
        </button>
        <Volume2 className="size-4 text-text-3" />
        <button onClick={() => mediaRef.current?.requestFullscreen?.()} aria-label="Fullscreen">
          <Maximize className="size-4 text-text-3" />
        </button>
      </div>
    </div>
  );
});
