import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/utils';
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
  const next = safeNextPath(request.cookies.get(`oauth_next_${provider}`)?.value, '/settings');

  const fail = (reason: string, detail?: string) => {
    const back = new URL(next, request.url);
    back.searchParams.set('connect_error', reason);
    // Local development only: show the provider's own reason so setup
    // problems are visible without reading the server log.
    if (detail && process.env.NODE_ENV !== 'production') {
      back.searchParams.set('connect_detail', detail.replace(/\s+/g, ' ').slice(0, 160));
    }
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
    const description = request.nextUrl.searchParams.get('error_description') ?? providerError;
    return fail(providerError === 'access_denied' ? 'cancelled' : 'provider_error', description);
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail(
      'state_mismatch',
      !cookieState
        ? 'No sign-in was started from this browser. Start from Settings, not from the provider’s own install button.'
        : 'The sign-in state did not match.',
    );
  }

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
    // The provider's JSON reason, without anything that could carry a token.
    const detail =
      (msg.match(/"(?:reason|error_description|error)"\s*:\s*"([^"]{1,160})"/) ?? [])[1] ?? msg.slice(0, 120);
    if (/redirect/i.test(msg)) return fail('redirect_mismatch', detail);
    if (/invalid_client|unauthorized_client|failed: 401/i.test(msg)) return fail('bad_client', detail);
    if (/save/i.test(msg)) return fail('save_failed', detail);
    return fail('exchange_failed', detail);
  }

  const back = new URL(next, request.url);
  back.searchParams.set('connected', provider);
  const res = NextResponse.redirect(back);
  res.cookies.delete(`oauth_state_${provider}`);
  res.cookies.delete(`oauth_next_${provider}`);
  return res;
}
