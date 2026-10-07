import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Per-user, per-minute rate limit for the Ask endpoints (architecture.md §11).
 * The count lives in Postgres (`bump_rate_limit`, migrations 0005 and 0006), so it holds
 * across server instances and restarts. If that function is not installed yet
 * the limiter falls back to an in-memory window rather than letting every
 * request through. Never throws.
 */
const buckets = new Map<string, number[]>();

function memoryLimit(id: string, perMinute: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(id) ?? []).filter((t) => t > now - 60_000);
  const ok = hits.length < perMinute;
  if (ok) hits.push(now);
  buckets.set(id, hits);
  return ok;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  perMinute: number,
): Promise<{ ok: boolean }> {
  // The in-memory window is a true 60 s sliding window on this instance; the
  // DB counter holds the limit across instances. Both must allow the request.
  const local = memoryLimit(`${key}:${userId}`, perMinute);
  if (!local) return { ok: false };
  const { data, error } = await supabase.rpc('bump_rate_limit', { p_bucket: key, p_limit: perMinute });
  if (!error && typeof data === 'boolean') return { ok: data };
  return { ok: true };
}

/** For anonymous endpoints (the help bot): keyed by client address. */
export function checkAnonRateLimit(key: string, ip: string, perMinute: number): { ok: boolean } {
  return { ok: memoryLimit(`${key}:ip:${ip}`, perMinute) };
}

/** The response every limited endpoint returns. */
export const RATE_LIMITED = {
  body: {
    error: 'rate_limited',
    message: 'You’re asking questions faster than we can answer. Wait a minute and try again.',
  },
  init: { status: 429, headers: { 'Retry-After': '60' } },
} as const;
