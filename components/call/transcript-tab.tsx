'use client';

import { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import type { TranscriptSegment, Attendee } from '@/lib/types';
import { msToClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function TranscriptTab({
  segments,
  attendees,
  currentMs,
  onSeek,
  title,
}: {
  segments: TranscriptSegment[];
  attendees: Attendee[];
  currentMs: number;
  onSeek: (ms: number) => void;
  title: string;
}) {
  const [query, setQuery] = useState('');

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
      <div className="mb-3 flex items-center gap-2">
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
        <button onClick={download} className="flex items-center gap-1 text-sm text-text-2 hover:text-text-1">
          <Download className="size-4" /> .txt
        </button>
      </div>

      <div className="max-h-[560px] space-y-1 overflow-y-auto pr-2 scroll-styled">
        {filtered.map((s) => {
          const isCurrent = segments[currentIdx]?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSeek(s.start_ms)}
              className={cn(
                'block w-full rounded-btn px-3 py-2 text-left transition-colors hover:bg-surface-2',
                isCurrent && 'bg-surface-2',
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-text-1">{nameFor(s.speaker_label)}</span>
                <span className="font-mono text-xs text-cyan tnum">{msToClock(s.start_ms)}</span>
              </div>
              <p className="mt-0.5 text-sm text-text-2">{s.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
