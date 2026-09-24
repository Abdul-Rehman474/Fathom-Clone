import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Call } from '@/lib/types';

export interface CallCardData extends Call {
  highlightCount: number;
  actionCount: number;
}

const PAGE_SIZE = 24;

export interface ListCallsOptions {
  scope?: 'mine' | 'team';
  page?: number;
  platform?: string;
  hasActionItems?: boolean;
  sort?: 'newest' | 'oldest';
}

/** Calls for the current user (My Calls) or their workspace (Team Calls). */
export async function listCalls(opts: ListCallsOptions = {}): Promise<{
  calls: CallCardData[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { calls: [], total: 0, page: 1, pageSize: PAGE_SIZE };

  // A browser recording or upload that never finished (tab closed, network
  // lost) would otherwise sit in "Recording" forever. After 6 hours it can't
  // still be running, so mark it failed with a clear reason.
  if (opts.scope !== 'team') {
    await supabase
      .from('calls')
      .update({ status: 'failed', failed_stage: 'uploading', error: 'The recording was never uploaded.' })
      .eq('owner_id', user.id)
      .in('source', ['tab', 'upload'])
      .in('status', ['recording', 'uploading'])
      .lt('created_at', new Date(Date.now() - 6 * 3600_000).toISOString());
  }

  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from('calls').select('*, action_items(count), highlights(count)', { count: 'exact' });

  if (opts.scope === 'team') {
    query = query.eq('visibility', 'workspace');
  } else {
    query = query.eq('owner_id', user.id);
  }
  if (opts.platform && opts.platform !== 'all') query = query.eq('platform', opts.platform);

  query = query.order('created_at', { ascending: opts.sort === 'oldest' }).range(from, to);

  const { data, count } = await query;

  let calls: CallCardData[] = (data ?? []).map((c) => {
    const row = c as unknown as Call & {
      action_items: { count: number }[];
      highlights: { count: number }[];
    };
    return {
      ...row,
      actionCount: row.action_items?.[0]?.count ?? 0,
      highlightCount: row.highlights?.[0]?.count ?? 0,
    };
  });

  if (opts.hasActionItems) calls = calls.filter((c) => c.actionCount > 0);

  return { calls, total: count ?? calls.length, page, pageSize: PAGE_SIZE };
}

export async function getProfileAndSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, settings: null };

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
  ]);
  return { user, profile, settings };
}
