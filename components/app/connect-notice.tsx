'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from '@/components/ui/toaster';

const NAMES: Record<string, string> = { google: 'Google Meet', zoom: 'Zoom' };
const REASONS: Record<string, string> = {
  state_mismatch: 'The sign-in window expired or was opened from another session. Try connecting again.',
  exchange_failed: 'The provider did not finish the connection. Try again.',
  cancelled: 'The connection was cancelled.',
  provider_error: 'The provider refused the connection. Check the app settings in its developer console.',
  redirect_mismatch:
    'The provider does not recognise this app’s callback address. Add it in the provider’s developer console.',
  bad_client: 'The provider rejected this app’s client ID or secret. Check the server settings.',
  save_failed: 'The connection worked but could not be saved. Try again.',
};

/**
 * Reads the OAuth callback's `?connected=` / `?connect_error=` result, shows
 * it once, and cleans the URL so a refresh does not repeat it.
 */
export function ConnectNotice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const connected = params.get('connected');
  const failed = params.get('connect_error');

  useEffect(() => {
    if (!connected && !failed) return;
    if (connected) toast.success(`${NAMES[connected] ?? 'Account'} connected`);
    if (failed) toast.error(REASONS[failed] ?? REASONS.exchange_failed);
    const rest = new URLSearchParams(params.toString());
    rest.delete('connected');
    rest.delete('connect_error');
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [connected, failed, params, pathname, router]);

  return null;
}
