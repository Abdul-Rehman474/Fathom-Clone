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
        const res = await fetch(`/api/calls/${callId}/retry`, { method: 'POST' });
        setBusy(false);
        if (res.ok) {
          toast.success('Retrying…');
          router.refresh();
        } else toast.error('Retry failed');
      }}
    >
      Retry
    </Button>
  );
}
