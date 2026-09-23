/**
 * Seam for the Meet/Zoom OAuth connectors (Prompt 3). Until real OAuth is
 * implemented, connect flows resolve to a clearly typed "not configured"
 * result that the UI handles gracefully — no dead handlers, no fake success.
 */
export type ConnectResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; reason: 'not_configured' };

export function startProviderConnect(provider: 'google' | 'zoom'): ConnectResult {
  // Real implementation (offline OAuth + state) lands in Prompt 3.
  void provider;
  return { ok: false, reason: 'not_configured' };
}
