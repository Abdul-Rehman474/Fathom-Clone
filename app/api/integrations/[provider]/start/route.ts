import { NextResponse, type NextRequest } from 'next/server';
import { startProviderConnect } from '@/lib/providers/integrations-stub';

/**
 * Connector entry point. The real offline-OAuth flow is filled in by Prompt 3;
 * for now it returns a typed "not configured" result and bounces back with a
 * flag the UI can surface, so the button is never a dead link.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const next = request.nextUrl.searchParams.get('next') ?? '/settings';

  if (provider !== 'google' && provider !== 'zoom') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  const result = startProviderConnect(provider);
  if (result.ok) {
    return NextResponse.redirect(result.redirectUrl);
  }

  const back = new URL(next, request.url);
  back.searchParams.set('connect', 'not_configured');
  back.searchParams.set('provider', provider);
  return NextResponse.redirect(back);
}
