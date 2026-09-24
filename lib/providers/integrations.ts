import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from '@/lib/crypto';
import { googleRefresh, type TokenSet } from '@/lib/providers/google-meet';
import { zoomRefresh } from '@/lib/providers/zoom';
import { MOCK_PROVIDERS } from '@/lib/config';

export type MeetingProvider = 'google' | 'zoom';

/**
 * The user's working connections. A row with no stored token (left over from
 * mock mode) is not a connection, so it is never shown as "Connected".
 */
export async function connectedIntegrations(supabase: SupabaseClient, userId: string) {
  let q = supabase.from('integrations').select('provider, account_email').eq('user_id', userId);
  if (!MOCK_PROVIDERS) q = q.not('access_token_enc', 'is', null);
  return q;
}

/** Persist an OAuth token set (encrypted) for a user + provider. */
export async function storeTokens(
  supabase: SupabaseClient,
  userId: string,
  provider: MeetingProvider,
  tokens: TokenSet,
  accountEmail: string | null,
): Promise<void> {
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
  const row: Record<string, unknown> = {
    user_id: userId,
    provider,
    access_token_enc: encryptToken(tokens.access_token),
    expires_at: expiresAt,
    scopes: tokens.scope ?? null,
    account_email: accountEmail,
  };
  if (tokens.refresh_token) row.refresh_token_enc = encryptToken(tokens.refresh_token);
  await supabase.from('integrations').upsert(row, { onConflict: 'user_id,provider' });
}

/**
 * Return a valid access token, refreshing on expiry (architecture.md §6).
 * Returns null when the provider isn't connected.
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string,
  provider: MeetingProvider,
): Promise<string | null> {
  const { data: row } = await supabase
    .from('integrations')
    .select('access_token_enc, refresh_token_enc, expires_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  if (!row?.access_token_enc) return null;

  const notExpired = row.expires_at && new Date(row.expires_at).getTime() > Date.now() + 60_000;
  if (notExpired) return decryptToken(row.access_token_enc);

  // Refresh.
  if (!row.refresh_token_enc) return decryptToken(row.access_token_enc);
  const refreshToken = decryptToken(row.refresh_token_enc);
  const refreshed = provider === 'google' ? await googleRefresh(refreshToken) : await zoomRefresh(refreshToken);
  // Google refresh may omit refresh_token; keep the old one.
  if (!refreshed.refresh_token) refreshed.refresh_token = refreshToken;
  await storeTokens(supabase, userId, provider, refreshed, null);
  return refreshed.access_token;
}
