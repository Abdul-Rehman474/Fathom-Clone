import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { storeTokens } from '@/lib/providers/integrations';
import { googleExchangeCode, googleAccountEmail } from '@/lib/providers/google-meet';
import { zoomExchangeCode, zoomAccountEmail } from '@/lib/providers/zoom';

/** OAuth callback: verify state, exchange the code, store encrypted tokens. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== 'google' && provider !== 'zoom') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const [cookieState, stateUser] = (request.cookies.get(`oauth_state_${provider}`)?.value ?? '').split('.');
  const rawNext = request.cookies.get(`oauth_next_${provider}`)?.value ?? '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\') ? rawNext : '/settings';

  const fail = (reason: string) => {
    const back = new URL(next, request.url);
    back.searchParams.set('connect_error', reason);
    return NextResponse.redirect(back);
  };

  // The provider sends ?error= instead of a code when the user cancels or the
  // app is misconfigured; report that, not a misleading state error.
  const providerError = request.nextUrl.searchParams.get('error');
  if (providerError) {
    console.error(
      `oauth ${provider} returned error`,
      providerError,
      request.nextUrl.searchParams.get('error_description'),
    );
    return fail(providerError === 'access_denied' ? 'cancelled' : 'provider_error');
  }
  if (!code || !state || !cookieState || state !== cookieState) return fail('state_mismatch');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  if (stateUser !== user.id) return fail('state_mismatch');

  try {
    if (provider === 'google') {
      const tokens = await googleExchangeCode(code);
      const email = await googleAccountEmail(tokens.access_token);
      await storeTokens(supabase, user.id, 'google', tokens, email);
    } else {
      const tokens = await zoomExchangeCode(code);
      const email = await zoomAccountEmail(tokens.access_token);
      await storeTokens(supabase, user.id, 'zoom', tokens, email);
    }
  } catch (e) {
    console.error(`oauth ${provider} exchange failed`, e);
    const msg = e instanceof Error ? e.message : '';
    if (/redirect/i.test(msg)) return fail('redirect_mismatch');
    if (/invalid_client|unauthorized_client|failed: 401/i.test(msg)) return fail('bad_client');
    if (/save/i.test(msg)) return fail('save_failed');
    return fail('exchange_failed');
  }

  const back = new URL(next, request.url);
  back.searchParams.set('connected', provider);
  const res = NextResponse.redirect(back);
  res.cookies.delete(`oauth_state_${provider}`);
  res.cookies.delete(`oauth_next_${provider}`);
  return res;
}
