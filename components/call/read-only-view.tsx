'use client';

import { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import type { SummaryContent, TranscriptSegment, Attendee, ActionItem } from '@/lib/types';
import { msToClock, secToDurationLabel, formatDate } from '@/lib/time';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/** Read-only call view for public share pages (UI.md §13). No edit, no Ask,
 *  no internal highlights. */
export function ReadOnlyView({
  mediaEndpoint,
  title,
  createdAt,
  durationSec,
  platform,
  summary,
  segments,
  attendees,
  actionItems,
}: {
  mediaEndpoint: string;
  title: string;
  createdAt: string;
  durationSec: number | null;
  platform: string;
  summary: SummaryContent | null;
  segments: TranscriptSegment[];
  attendees: Attendee[];
  actionItems: ActionItem[];
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    fetch(mediaEndpoint)
      .then((r) => r.json())
      .then((d) => setUrl(d.url))
      .catch(() => {});
  }, [mediaEndpoint]);

  const nameFor = (label: string | null) =>
    attendees.find((a) => a.speaker_label === label)?.name ?? label ?? 'Speaker';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-frame border border-border bg-black">
          {url ? (
            <MiniPlayer url={url} />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-text-3">
              Recording playback isn’t available.
            </div>
          )}
        </div>

        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>
          <div className="pt-5">
            <TabsContent value="summary">
              {summary ? (
                <div className="space-y-5 text-sm text-text-2">
                  <p>{summary.overview}</p>
                  {summary.key_takeaways.length > 0 && (
                    <Block title="Key takeaways" items={summary.key_takeaways} />
                  )}
                  {summary.topics.map((t, i) => (
                    <div key={i}>
                      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-3">{t.title}</h3>
                      <ul className="space-y-1">
                        {t.bullets.map((b, j) => (
                          <li key={j}>• {b.text}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {summary.decisions.length > 0 && (
                    <Block title="Decisions" items={summary.decisions.map((d) => d.text)} />
                  )}
                </div>
              ) : (
                <p className="text-text-3">No summary.</p>
              )}
            </TabsContent>
            <TabsContent value="transcript">
              <div className="max-h-[560px] space-y-2 overflow-y-auto pr-2 scroll-styled">
                {segments.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">{nameFor(s.speaker_label)}</span>
                      <span className="font-mono text-xs text-cyan tnum">{msToClock(s.start_ms)}</span>
                    </div>
                    <p className="text-sm text-text-2">{s.text}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-text-3 tnum">
            {formatDate(createdAt)} · {secToDurationLabel(durationSec)} · <span className="capitalize">{platform}</span>
          </p>
        </div>
        {actionItems.length > 0 && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">Action items</h2>
            <ul className="space-y-1.5">
              {actionItems.map((a) => (
                <li key={a.id} className="text-sm text-text-2">
                  {a.done ? '☑' : '☐'} {a.text}
                  {a.assignee ? ` — ${a.assignee}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-3">{title}</h3>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={i}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}

function MiniPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const [el, setEl] = useState<HTMLVideoElement | null>(null);
  return (
    <div>
      <video ref={setEl} src={url} className="aspect-video w-full" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div className="flex items-center gap-2 border-t border-border bg-surface-1 px-4 py-2">
        <button
          onClick={() => {
            if (!el) return;
            if (el.paused) el.play();
            else el.pause();
          }}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
      </div>
    </div>
  );
}
