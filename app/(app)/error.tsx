'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Error state for app screens: a plain message and a retry, never a stack trace. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="mx-auto max-w-lg py-20">
      <p className="micro-label mb-3 !text-danger">Something went wrong</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">This page could not load.</h1>
      <p className="mt-3 text-text-2">Check your connection and try again. Your data is safe.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/calls" className="inline-flex h-10 items-center px-4 text-sm text-text-2 hover:text-off-white">
          Back to My Calls
        </Link>
      </div>
    </div>
  );
}
