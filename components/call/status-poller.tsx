'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Refreshes the route while a call is still processing (UI.md §7). */
export function StatusPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs]);
  return null;
}
