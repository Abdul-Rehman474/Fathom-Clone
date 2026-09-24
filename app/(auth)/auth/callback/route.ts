import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { postAuthPath } from '@/lib/onboarding';

/**
 * OAuth callback. Exchanges the code for a session, then routes to onboarding
 * (resuming at the saved step) or to the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/calls';

  if (!code) {
    // Provider returned an error (e.g. the user cancelled) or no code at all.
    const reason = searchParams.get('error') === 'access_denied' ? 'cancelled' : 'oauth_failed';
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dest = next;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done, onboarding_step')
      .eq('id', user.id)
      .maybeSingle();
    dest = postAuthPath(profile?.onboarding_done ?? false, profile?.onboarding_step ?? 1, next);
  }

  return NextResponse.redirect(`${origin}${dest}`);
}
