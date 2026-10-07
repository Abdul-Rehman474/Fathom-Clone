'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Stop refreshing after this long; a call still active by then is stuck, not progressing. */
const MAX_POLL_MS = 30 * 60_000;

/**
 * Refreshes the route while calls are still active (UI.md §7). Given call
 * ids, it first pings their status endpoint so bot calls sync with the
 * provider. Rendered only while something is active, so polling stops once
 * everything is ready or failed. One request cycle at a time, and nothing
 * while the tab is hidden.
 */
export function StatusPoller({
  callId,
  callIds,
  intervalMs = 4000,
}: {
  callId?: string;
  callIds?: string[];
  intervalMs?: number;
}) {
  const router = useRouter();
  const ids = (callIds ?? (callId ? [callId] : [])).join(',');
  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const tick = async () => {
      if (stop || Date.now() - started > MAX_POLL_MS) return;
      if (document.visibilityState === 'visible') {
        if (ids) {
          await Promise.all(
            ids.split(',').map((id) => fetch(`/api/calls/${id}/status`, { cache: 'no-store' }).catch(() => null)),
          );
        }
        if (!stop) router.refresh();
      }
      if (!stop) timer = setTimeout(tick, intervalMs);
    };
    timer = setTimeout(tick, intervalMs);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [router, intervalMs, ids]);
  return null;
}
