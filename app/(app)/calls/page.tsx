import Link from 'next/link';
import { listCalls, getProfileAndSettings, type CallCardData } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { searchSegments, groupHitsByCall } from '@/lib/search';
import { MeetingRow } from '@/components/call/meeting-row';
import { CallsFilterBar } from '@/components/app/calls-filter-bar';
import { AskPanel } from '@/components/app/ask-panel';
import { NewMeetingDialog } from '@/components/app/new-meeting-dialog';
import { Button } from '@/components/ui/button';
import { TimestampChip } from '@/components/ui/chips';
import { formatMonth, formatDate } from '@/lib/time';

export const metadata = { title: 'My Calls' };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">
            {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{q}”
          </h1>
          <Link href="/calls" className="text-sm text-lime hover:underline">
            Clear search
          </Link>
        </div>
        {hits.length === 0 ? (
          <p className="text-muted">No transcripts match that phrase.</p>
        ) : (
          <div>
            {hits.map((h) => (
              <Link key={h.callId} href={`/calls/${h.callId}`} className="group block border-b border-border py-5 hover:translate-x-0.5 transition-transform">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold group-hover:text-lime">{h.title}</span>
                  <span className="text-xs text-text-3 tnum">{formatDate(h.createdAt)}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {h.snippets.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted">
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
    );
  }

  const page = Number(sp.page ?? '1') || 1;
  const platform = sp.platform ?? 'all';
  const sort = (sp.sort as 'newest' | 'oldest') ?? 'newest';
  const hasActionItems = sp.actions === 'true';

  const [{ calls, total, pageSize }, { profile }] = await Promise.all([
    listCalls({ scope: 'mine', page, platform, sort, hasActionItems }),
    getProfileAndSettings(),
  ]);
  const grouped = groupByMonth(calls);
  const hasMore = page * pageSize < total;
  const firstName = (profile?.full_name ?? 'there').split(' ')[0];

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">
        {/* Greeting / command header */}
        <header className="mb-10">
          <p className="micro-label mb-3">{greeting()}, {firstName}</p>
          <h1 className="max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Your meetings,
            <br />
            <span className="text-muted">organized and understood.</span>
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <NewMeetingDialog>
              <Button>New Meeting</Button>
            </NewMeetingDialog>
            <NewMeetingDialog>
              <Button variant="outline">Start Capture</Button>
            </NewMeetingDialog>
          </div>
        </header>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="micro-label">Recent meetings</p>
          <CallsFilterBar platform={platform} sort={sort} hasActionItems={hasActionItems} />
        </div>

        {calls.length === 0 ? (
          <div className="border-t border-border py-20 text-center">
            <p className="micro-label mb-3">No calls yet</p>
            <p className="mx-auto max-w-sm text-muted">
              Your meetings will appear here once you start capturing them.
            </p>
            <div className="mt-6 flex justify-center">
              <NewMeetingDialog>
                <Button>Start a meeting →</Button>
              </NewMeetingDialog>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([month, monthCalls]) => (
              <section key={month}>
                <h2 className="mb-1 font-display text-sm font-semibold text-text-3">{month}</h2>
                <div className="border-t border-border">
                  {monthCalls.map((c) => (
                    <MeetingRow key={c.id} call={c} />
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

      <div className="hidden xl:block">
        <AskPanel />
      </div>
    </div>
  );
}
