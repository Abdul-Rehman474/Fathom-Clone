'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { convertToTeam } from '@/app/(app)/team/actions';

/** "Start 14-Day Trial" — converts a personal account to a team workspace. */
export function TeamUpsellCta() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await convertToTeam();
        router.refresh();
      }}
    >
      {busy ? 'Setting up…' : 'Start 14-Day Trial'}
    </Button>
  );
}
