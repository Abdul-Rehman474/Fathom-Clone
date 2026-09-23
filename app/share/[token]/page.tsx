import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { BrandMark } from '@/components/brand';
import { Pill } from '@/components/ui/button';
import { ReadOnlyView } from '@/components/call/read-only-view';
import type { SummaryContent, TranscriptSegment, Attendee, ActionItem } from '@/lib/types';

export const metadata = { title: 'Shared call' };

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: call } = await admin
    .from('calls')
    .select('id, title, created_at, duration_sec, platform, share_access, owner_id')
    .eq('share_token', token)
    .maybeSingle();

  if (!call || call.share_access !== 'link') {
    return (
      <Unavailable />
    );
  }

  const [{ data: summary }, { data: segments }, { data: attendees }, { data: actionItems }, { data: owner }] =
    await Promise.all([
      admin.from('summaries').select('content').eq('call_id', call.id).maybeSingle(),
      admin.from('transcript_segments').select('*').eq('call_id', call.id).order('idx'),
      admin.from('attendees').select('*').eq('call_id', call.id),
      admin.from('action_items').select('*').eq('call_id', call.id).order('position'),
      admin.from('profiles').select('full_name').eq('id', call.owner_id).maybeSingle(),
    ]);

  return (
    <div className="min-h-screen bg-bg-app">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <BrandMark />
          <span className="text-sm text-text-3">
            {call.title} · Shared by {owner?.full_name ?? 'a Fathom user'}
          </span>
        </div>
        <Link href="/signup">
          <Pill className="h-10 px-6 text-sm">Sign up free</Pill>
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ReadOnlyView
          mediaEndpoint={`/api/share/${token}/media`}
          title={call.title ?? 'Shared call'}
          createdAt={call.created_at}
          durationSec={call.duration_sec}
          platform={call.platform}
          summary={(summary?.content ?? null) as SummaryContent | null}
          segments={(segments ?? []) as TranscriptSegment[]}
          attendees={(attendees ?? []) as Attendee[]}
          actionItems={(actionItems ?? []) as ActionItem[]}
        />
      </main>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-app text-center">
      <BrandMark href="/" />
      <p className="text-lg font-semibold">This link is no longer available</p>
      <Link href="/" className="text-cyan hover:underline">
        Go home
      </Link>
    </div>
  );
}
