'use client';

import { Toaster as SonnerToaster } from 'sonner';

/** App-wide toast host (UI.md §0): bottom-right, opaque surfaces, no gradients. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--surface-2)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-1)',
          borderRadius: '10px',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
