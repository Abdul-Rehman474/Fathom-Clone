import 'server-only';
import type { TokenSet } from '@/lib/providers/google-meet';

/** Zoom connector (architecture.md §6). OAuth + create a meeting. */
const AUTH = 'https://zoom.us/oauth/authorize';
const TOKEN = 'https://zoom.us/oauth/token';

export function zoomRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/zoom/callback`;
}

export function zoomAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOOM_CLIENT_ID ?? '',
    redirect_uri: zoomRedirectUri(),
    state,
  });
  return `${AUTH}?${params}`;
}

function basicAuth(): string {
  const creds = `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(creds).toString('base64')}`;
}

export async function zoomExchangeCode(code: string): Promise<TokenSet> {
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: zoomRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`Zoom token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function zoomRefresh(refreshToken: string): Promise<TokenSet> {
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Zoom refresh failed: ${res.status}`);
  return res.json();
}

export async function zoomAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.zoom.us/v2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string };
  return json.email ?? null;
}

/** Create a Zoom meeting, returning the join URL. */
export async function zoomCreateMeeting(accessToken: string, topic: string): Promise<string> {
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: topic || 'Fathom meeting', type: 1 }),
  });
  if (!res.ok) throw new Error(`Zoom create meeting failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { join_url?: string };
  if (!json.join_url) throw new Error('No join_url returned');
  return json.join_url;
}
