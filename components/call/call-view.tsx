'use client';

import { useRef, useState } from 'react';
import { Player, type PlayerHandle } from '@/components/call/player';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SummaryTab } from '@/components/call/summary-tab';
import { TranscriptTab } from '@/components/call/transcript-tab';
import { AskTab } from '@/components/call/ask-tab';
import { RightColumn } from '@/components/call/right-column';
import type {
  Call,
  Attendee,
  ActionItem,
  Highlight,
  HighlightTag,
  TranscriptSegment,
  SummaryContent,
} from '@/lib/types';

export function CallView({
  call,
  segments,
  summary,
  attendees,
  actionItems,
  highlights,
  tags,
  playlists,
}: {
  call: Call;
  segments: TranscriptSegment[];
  summary: SummaryContent | null;
  attendees: Attendee[];
  actionItems: ActionItem[];
  highlights: Highlight[];
  tags: HighlightTag[];
  playlists: { id: string; title: string }[];
}) {
  const playerRef = useRef<PlayerHandle>(null);
  const [currentMs, setCurrentMs] = useState(0);

  const [tab, setTab] = useState('summary');
  const [focusMs, setFocusMs] = useState<number | null>(null);

  // Seek the player; with no recording, jump to that moment in the transcript.
  const seek = (ms: number) => {
    if (playerRef.current?.seek(ms)) return;
    setCurrentMs(ms);
    setFocusMs(ms);
    setTab('transcript');
  };
  const markers = highlights.map((h) => {
    const color = tags.find((t) => t.id === h.tag_id)?.color ?? '#C8FF3D';
    return { ms: h.start_ms, color };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <Player ref={playerRef} callId={call.id} markers={markers} onTime={setCurrentMs} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="ask">Ask Fathom</TabsTrigger>
          </TabsList>
          <div className="pt-5">
            <TabsContent value="summary">
              {summary ? (
                <SummaryTab callId={call.id} content={summary} template={call.template ?? 'general'} onSeek={seek} />
              ) : (
                <p className="text-text-3">No summary yet.</p>
              )}
            </TabsContent>
            <TabsContent value="transcript">
              <TranscriptTab
                segments={segments}
                attendees={attendees}
                currentMs={currentMs}
                focusMs={focusMs}
                onSeek={seek}
                title={call.title ?? 'transcript'}
              />
            </TabsContent>
            <TabsContent value="ask">
              <AskTab callId={call.id} onSeek={seek} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <RightColumn
        call={call}
        attendees={attendees}
        actionItems={actionItems}
        highlights={highlights}
        tags={tags}
        playlists={playlists}
        currentMs={currentMs}
        onSeek={seek}
      />
    </div>
  );
}
