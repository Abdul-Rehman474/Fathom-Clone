'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Download } from 'lucide-react';
import type { TranscriptSegment, Attendee } from '@/lib/types';
import { msToClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function TranscriptTab({
  segments,
  attendees,
  currentMs,
  focusMs,
  onSeek,
  title,
}: {
  segments: TranscriptSegment[];
  attendees: Attendee[];
  currentMs: number;
  /** When set (e.g. a timestamp was clicked with no recording), scroll to it. */
  focusMs?: number | null;
  onSeek: (ms: number) => void;
  title: string;
}) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const nameFor = useMemo(() => {
    const map = new Map(attendees.map((a) => [a.speaker_label ?? '', a.name]));
    return (label: string | null) => (label && map.get(label)) || label || 'Speaker';
  }, [attendees]);

  const filtered = query
    ? segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
    : segments;

  const currentIdx = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (currentMs >= segments[i].start_ms) idx = i;
      else break;
    }
    return idx;
  }, [segments, currentMs]);

  // Scroll the focused moment into view inside the transcript pane.
  useEffect(() => {
    if (focusMs == null) return;
    let target: TranscriptSegment | undefined;
    for (const s of segments) {
      if (s.start_ms <= focusMs) target = s;
      else break;
    }
    if (!target) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-seg="${target.id}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusMs, segments]);

  function download() {
    const text = segments
      .map((s) => `[${msToClock(s.start_ms)}] ${nameFor(s.speaker_label)}: ${s.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title || 'transcript'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript"
            className="pl-9"
          />
        </div>
        {query && <span className="text-xs text-text-3 tnum">{filtered.length} matches</span>}
        <button
          onClick={download}
          className="flex items-center gap-1.5 text-sm text-text-2 transition-colors hover:text-lime"
        >
          <Download className="size-4" /> .txt
        </button>
      </div>

      <div ref={listRef} className="max-h-[620px] overflow-y-auto pr-2 scroll-styled">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-text-3">No lines match “{query}”.</p>
        )}
        {filtered.map((s) => {
          const isCurrent = segments[currentIdx]?.id === s.id;
          return (
            <button
              key={s.id}
              data-seg={s.id}
              onClick={() => onSeek(s.start_ms)}
              className={cn(
                'grid w-full grid-cols-[52px_1fr] gap-4 border-l-2 py-3 pl-3 pr-2 text-left transition-colors hover:bg-white/[0.03]',
                isCurrent ? 'border-lime bg-white/[0.03]' : 'border-transparent',
              )}
            >
              <span className="pt-0.5 font-mono text-xs text-lime tnum">{msToClock(s.start_ms)}</span>
              <span>
                <span className="micro-label !text-text-2">{nameFor(s.speaker_label)}</span>
                <span className="mt-1 block leading-relaxed text-off-white/90">{s.text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
