import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { listCalls, type CallCardData } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { searchSegments, groupHitsByCall } from '@/lib/search';
import { CallCard } from '@/components/call/call-card';
import { CallsFilterBar } from '@/components/app/calls-filter-bar';
import { AskPanel } from '@/components/app/ask-panel';
import { Button } from '@/components/ui/button';
import { NewMeetingDialog } from '@/components/app/new-meeting-dialog';
import { TimestampChip } from '@/components/ui/chips';
import { formatMonth, formatDate } from '@/lib/time';

export const metadata = { title: 'My Calls' };

function groupByMonth(calls: CallCardData[]) {
  const groups = new Map<string, CallCardData[]>();
  for (const c of calls) {
    const key = formatMonth(c.created_at);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(c);
  }
  return [...groups.entries()];
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  // Search-results mode
  if (q) {
    const supabase = await createClient();
    const hits = groupHitsByCall(await searchSegments(supabase, q));
    return (
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{q}”
            </h1>
            <Link href="/calls" className="text-sm text-cyan hover:underline">
              Clear search
            </Link>
          </div>
          {hits.length === 0 ? (
            <p className="text-text-3">No transcripts match that phrase.</p>
          ) : (
            <div className="space-y-4">
              {hits.map((h) => (
                <Link
                  key={h.callId}
                  href={`/calls/${h.callId}`}
                  className="block rounded-card border border-border bg-surface-1 p-4 hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{h.title}</span>
                    <span className="text-xs text-text-3 tnum">{formatDate(h.createdAt)}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {h.snippets.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-text-2">
                        <TimestampChip ms={s.startMs} />
                        <span className="line-clamp-1">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const page = Number(sp.page ?? '1') || 1;
  const platform = sp.platform ?? 'all';
  const sort = (sp.sort as 'newest' | 'oldest') ?? 'newest';
  const hasActionItems = sp.actions === 'true';

  const { calls, total, pageSize } = await listCalls({
    scope: 'mine',
    page,
    platform,
    sort,
    hasActionItems,
  });
  const grouped = groupByMonth(calls);
  const hasMore = page * pageSize < total;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between gap-4">
          <CallsFilterBar platform={platform} sort={sort} hasActionItems={hasActionItems} />
        </div>

        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-frame border border-border bg-surface-1 py-24 text-center">
            <Inbox className="size-10 text-text-3" />
            <p className="text-lg font-semibold">No call recordings</p>
            <NewMeetingDialog>
              <Button>+ New Meeting</Button>
            </NewMeetingDialog>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([month, monthCalls]) => (
              <section key={month}>
                <h2 className="mb-3 text-base font-semibold">{month}</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {monthCalls.map((c) => (
                    <CallCard key={c.id} call={c} />
                  ))}
                </div>
              </section>
            ))}
            {hasMore && (
              <div className="flex justify-center">
                <Link href={`/calls?page=${page + 1}`}>
                  <Button variant="secondary">Load more</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <AskPanel />
    </div>
  );
}
