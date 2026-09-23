import 'server-only';

/** Google Meet connector (architecture.md §6). OAuth + create a meeting space. */
const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/meetings.space.created openid email';

export function googleRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${AUTH}?${params}`;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

export async function googleExchangeCode(code: string): Promise<TokenSet> {
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function googleRefresh(refreshToken: string): Promise<TokenSet> {
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google refresh failed: ${res.status}`);
  return res.json();
}

export async function googleAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string };
  return json.email ?? null;
}

/** Create a Meet space, returning the join URL. */
export async function googleCreateSpace(accessToken: string): Promise<string> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`Google create space failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { meetingUri?: string };
  if (!json.meetingUri) throw new Error('No meetingUri returned');
  return json.meetingUri;
}
