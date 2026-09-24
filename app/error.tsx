'use client';

import { useEffect } from 'react';

/** Error state for public pages (marketing, share, auth). */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main role="alert" className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">This page could not load.</h1>
      <p className="mt-3 text-text-2">Check your connection and try again.</p>
      <button
        onClick={reset}
        className="mt-8 h-10 w-fit rounded-btn bg-lime px-5 text-sm font-semibold text-carbon hover:bg-lime/90"
      >
        Try again
      </button>
    </main>
  );
}
