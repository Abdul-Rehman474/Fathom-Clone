import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SnippetHit {
  callId: string;
  title: string;
  createdAt: string;
  startMs: number;
  text: string;
}

/**
 * Full-text search over transcript segments for the current user's calls
 * (architecture.md §4.2). Uses Postgres websearch_to_tsquery via the generated
 * tsv column. RLS on `transcript_segments` scopes results to viewable calls.
 */
export async function searchSegments(
  supabase: SupabaseClient,
  query: string,
  limit = 30,
): Promise<SnippetHit[]> {
  const q = query.trim();
  if (!q) return [];

  const { data } = await supabase
    .from('transcript_segments')
    .select('call_id, start_ms, text, calls!inner(title, created_at)')
    .textSearch('tsv', q, { type: 'websearch' })
    .limit(limit);

  return (data ?? []).map((r) => {
    const row = r as unknown as {
      call_id: string;
      start_ms: number;
      text: string;
      calls: { title: string | null; created_at: string };
    };
    return {
      callId: row.call_id,
      title: row.calls?.title ?? 'Untitled',
      createdAt: row.calls?.created_at ?? '',
      startMs: row.start_ms,
      text: row.text,
    };
  });
}

/** Group snippet hits by call, keeping the top snippets per call. */
export function groupHitsByCall(hits: SnippetHit[]) {
  const map = new Map<string, { title: string; createdAt: string; snippets: SnippetHit[] }>();
  for (const h of hits) {
    const entry = map.get(h.callId) ?? { title: h.title, createdAt: h.createdAt, snippets: [] };
    if (entry.snippets.length < 3) entry.snippets.push(h);
    map.set(h.callId, entry);
  }
  return [...map.entries()].map(([callId, v]) => ({ callId, ...v }));
}
