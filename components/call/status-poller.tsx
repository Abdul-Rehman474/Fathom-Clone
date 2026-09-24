'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Refreshes the route while calls are still active (UI.md §7). Given call
 * ids, it first pings their status endpoint so bot calls sync with the
 * provider. Rendered only while something is active, so polling stops once
 * everything is ready or failed.
 */
export function StatusPoller({ callId, callIds, intervalMs = 4000 }: { callId?: string; callIds?: string[]; intervalMs?: number }) {
  const router = useRouter();
  const ids = (callIds ?? (callId ? [callId] : [])).join(',');
  useEffect(() => {
    const t = setInterval(async () => {
      if (ids) {
        await Promise.all(
          ids.split(',').map((id) => fetch(`/api/calls/${id}/status`, { cache: 'no-store' }).catch(() => null)),
        );
      }
      router.refresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs, ids]);
  return null;
}
