import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CallView } from '@/components/call/call-view';
import { StatusPoller } from '@/components/call/status-poller';
import { RetryButton } from '@/components/call/retry-button';
import { NotetakerLive } from '@/components/call/notetaker-live';
import { isTerminal } from '@/lib/pipeline/status';
import type { Call, SummaryContent, TranscriptSegment, Attendee, ActionItem, Highlight, HighlightTag } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('calls').select('title').eq('id', id).maybeSingle();
  return { title: data?.title ?? 'Call' };
}

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: call } = await supabase.from('calls').select('*').eq('id', id).maybeSingle();
  if (!call) notFound();
  const c = call as Call;

  // Notetaker calls: live bot lifecycle until ready (PRD FR-3.2).
  const botFailed = c.status === 'failed' && c.failed_stage === 'bot';
  if (c.source === 'bot' && (!isTerminal(c.status) || botFailed)) {
    return (
      <div className="mx-auto max-w-lg py-20">
        <p className="mb-2 truncate text-sm text-text-3">{c.title ?? 'Meeting'}</p>
        <NotetakerLive
          callId={c.id}
          initial={{ status: c.status, error: c.error, failedStage: c.failed_stage }}
        />
      </div>
    );
  }

  // Processing / failed states
  if (!isTerminal(c.status)) {
    const steps = [
      { label: 'Recorded', state: 'done' },
      { label: 'Transcribing', state: c.status === 'transcribing' ? 'active' : c.status === 'summarizing' ? 'done' : 'todo' },
      { label: 'Summarizing', state: c.status === 'summarizing' ? 'active' : 'todo' },
    ] as const;
    return (
      <div className="mx-auto max-w-lg py-20">
        <StatusPoller callId={c.id} />
        <p className="micro-label mb-3">Processing</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{c.title ?? 'Your recording'}</h1>
        <p className="mt-3 text-text-2">This usually takes under a minute. The page updates on its own.</p>
        <ol className="mt-10 border-t border-border">
          {steps.map((st) => (
            <li key={st.label} className="flex items-center justify-between border-b border-border py-4">
              <span className={st.state === 'todo' ? 'text-text-3' : 'text-off-white'}>{st.label}</span>
              {st.state === 'done' && <span className="text-sm text-lime">Done</span>}
              {st.state === 'active' && (
                <span className="flex items-center gap-2 text-sm text-lime">
                  <Loader2 className="size-4 animate-spin" /> In progress
                </span>
              )}
              {st.state === 'todo' && <span className="text-sm text-text-3">Waiting</span>}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (c.status === 'failed') {
    const stage = c.failed_stage === 'summarizing' ? 'the summary step' : 'transcription';
    return (
      <div className="mx-auto max-w-lg py-20">
        <p className="micro-label mb-3 !text-danger">Processing stopped</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">We couldn’t process this recording.</h1>
        <p className="mt-3 text-text-2">Something went wrong during {stage}. Retrying resumes from that step.</p>
        {c.error && <p className="mt-3 line-clamp-2 text-xs text-text-3">Details: {c.error.slice(0, 160)}</p>}
        <div className="mt-8 flex gap-3">
          <RetryButton callId={c.id} />
          <Link href="/calls" className="inline-flex h-10 items-center px-4 text-sm text-text-2 hover:text-off-white">
            Back to My Calls
          </Link>
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
    <>
      <Link
        href="/calls"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-3 transition-colors hover:text-lime"
      >
        <ArrowLeft className="size-4" /> Back to My Calls
      </Link>
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
    </>
  );
}
