import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Per-user, per-minute rate limit for the Ask endpoints (architecture.md §11).
 * In-memory sliding window — good enough per instance; Prompt 6 hardens this
 * into a durable DB counter. Never throws.
 */
const buckets = new Map<string, number[]>();

export async function checkRateLimit(
  _supabase: SupabaseClient,
  userId: string,
  key: string,
  perMinute: number,
): Promise<{ ok: boolean; remaining: number }> {
  void _supabase;
  const now = Date.now();
  const windowStart = now - 60_000;
  const id = `${key}:${userId}`;
  const hits = (buckets.get(id) ?? []).filter((t) => t > windowStart);
  if (hits.length >= perMinute) {
    buckets.set(id, hits);
    return { ok: false, remaining: 0 };
  }
  hits.push(now);
  buckets.set(id, hits);
  return { ok: true, remaining: perMinute - hits.length };
}
