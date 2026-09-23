import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_PROVIDERS } from '@/lib/config';
import { randomState } from '@/lib/crypto';
import { googleAuthUrl } from '@/lib/providers/google-meet';
import { zoomAuthUrl } from '@/lib/providers/zoom';

/** Begin the meeting-provider OAuth flow (architecture.md §6). CSRF via `state`
 *  stored in an httpOnly cookie. In mock mode, mark connected without OAuth. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const next = request.nextUrl.searchParams.get('next') ?? '/settings';
  if (provider !== 'google' && provider !== 'zoom') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));

  // Mock: store a fake-but-real-looking connection and bounce back.
  if (MOCK_PROVIDERS) {
    await supabase.from('integrations').upsert(
      {
        user_id: user.id,
        provider,
        account_email: user.email ?? `${provider}@example.com`,
        scopes: 'mock',
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      { onConflict: 'user_id,provider' },
    );
    const back = new URL(next, request.url);
    back.searchParams.set('connected', provider);
    return NextResponse.redirect(back);
  }

  const state = randomState();
  const url = provider === 'google' ? googleAuthUrl(state) : zoomAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set(`oauth_state_${provider}`, state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
  res.cookies.set(`oauth_next_${provider}`, next, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
}
