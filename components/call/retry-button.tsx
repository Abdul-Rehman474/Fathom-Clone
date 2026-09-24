'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';

export function RetryButton({ callId }: { callId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/calls/${callId}/retry`, { method: 'POST' });
          const json = (await res.json().catch(() => ({}))) as { message?: string };
          if (res.ok) {
            toast.success('Retrying…');
            router.refresh();
          } else toast.error(json.message ?? 'Retry did not start. Try again.');
        } catch {
          toast.error('Retry did not go through. Check your connection.');
        } finally {
          setBusy(false);
        }
      }}
    >
      Retry
    </Button>
  );
}
