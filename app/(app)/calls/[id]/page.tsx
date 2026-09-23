import { notFound } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CallView } from '@/components/call/call-view';
import { StatusPoller } from '@/components/call/status-poller';
import { RetryButton } from '@/components/call/retry-button';
import { isTerminal } from '@/lib/pipeline/status';
import type { Call, SummaryContent, TranscriptSegment, Attendee, ActionItem, Highlight, HighlightTag } from '@/lib/types';

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: call } = await supabase.from('calls').select('*').eq('id', id).maybeSingle();
  if (!call) notFound();
  const c = call as Call;

  // Processing / failed states
  if (!isTerminal(c.status)) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <StatusPoller />
        <Loader2 className="mx-auto size-8 animate-spin text-cyan" />
        <h1 className="mt-4 text-lg font-semibold">{c.title ?? 'Processing your recording'}</h1>
        <p className="mt-2 text-sm text-text-2">
          Recorded ✓ → {c.status === 'transcribing' ? 'Transcribing ●' : 'Transcribed ✓'} →{' '}
          {c.status === 'summarizing' ? 'Summarizing ●' : 'Summarizing ○'}
        </p>
      </div>
    );
  }
  if (c.status === 'failed') {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <AlertTriangle className="mx-auto size-8 text-danger" />
        <h1 className="mt-4 text-lg font-semibold">Processing failed</h1>
        <p className="mt-2 text-sm text-text-2">{c.error ?? 'Something went wrong.'}</p>
        <div className="mt-4">
          <RetryButton callId={c.id} />
        </div>
      </div>
    );
  }

  const [segRes, sumRes, attRes, aiRes, hlRes, tagRes, plRes] = await Promise.all([
    supabase.from('transcript_segments').select('*').eq('call_id', id).order('idx'),
    supabase.from('summaries').select('content, template').eq('call_id', id).maybeSingle(),
    supabase.from('attendees').select('*').eq('call_id', id),
    supabase.from('action_items').select('*').eq('call_id', id).order('position'),
    supabase.from('highlights').select('*').eq('call_id', id).order('start_ms'),
    supabase.from('highlight_tags').select('*').eq('user_id', user?.id ?? '').order('position'),
    supabase.from('playlists').select('id, title').eq('owner_id', user?.id ?? '').order('updated_at', { ascending: false }),
  ]);

  return (
    <CallView
      call={c}
      segments={(segRes.data ?? []) as TranscriptSegment[]}
      summary={(sumRes.data?.content ?? null) as SummaryContent | null}
      attendees={(attRes.data ?? []) as Attendee[]}
      actionItems={(aiRes.data ?? []) as ActionItem[]}
      highlights={(hlRes.data ?? []) as Highlight[]}
      tags={(tagRes.data ?? []) as HighlightTag[]}
      playlists={(plRes.data ?? []) as { id: string; title: string }[]}
    />
  );
}
