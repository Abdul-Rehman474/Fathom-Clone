'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { safeNextPath } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BRAND_NAME } from '@/lib/config';
import { toast } from '@/components/ui/toaster';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** Friendly copy for `?error=` codes set by the OAuth callback. */
const AUTH_ERRORS: Record<string, string> = {
  cancelled: 'Google sign-in was cancelled. Try again when you’re ready.',
  oauth_failed: 'We couldn’t complete Google sign-in. Please try again.',
  session_failed: 'Your sign-in link expired or was already used. Please try again.',
};

const MICROSOFT_ENABLED = process.env.NEXT_PUBLIC_MICROSOFT_ENABLED === 'true';

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

export function AuthPanel({ mode }: { mode: 'signin' | 'signup' }) {
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [loading, setLoading] = useState<null | 'google'>(null);
  const errorCode = params.get('error');
  const authError = errorCode ? (AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.oauth_failed) : null;

  async function signInWithGoogle() {
    setLoading('google');
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setLoading(null);
      console.warn('Google sign-in failed to start', e);
      toast.error('We couldn’t start Google sign-in. Check your connection and try again.');
    }
  }

  const title = mode === 'signup' ? 'Create your account' : 'Sign in';

  return (
    <TooltipProvider delayDuration={150}>
      <div>
        <p className="micro-label mb-4">{BRAND_NAME}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-off-white">{title}</h1>
        <p className="mt-3 text-text-2">
          {mode === 'signup'
            ? 'Use your Google account. It takes about a minute.'
            : 'Use the Google account you signed up with.'}
        </p>

        {authError && (
          <p role="alert" className="mt-6 border-l-2 border-danger pl-3 text-sm text-danger">
            {authError}
          </p>
        )}

        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading !== null}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-btn bg-off-white text-sm font-semibold text-carbon transition-all hover:-translate-y-px hover:bg-white disabled:opacity-60"
          >
            {loading === 'google' ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
            Continue with Google
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block">
                <button
                  type="button"
                  disabled={!MICROSOFT_ENABLED}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-btn border border-border-strong text-sm font-semibold text-text-2 transition-colors hover:border-off-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid size-4 grid-cols-2 gap-px opacity-80" aria-hidden>
                    <span className="bg-[#F25022]" />
                    <span className="bg-[#7FBA00]" />
                    <span className="bg-[#00A4EF]" />
                    <span className="bg-[#FFB900]" />
                  </span>
                  Continue with Microsoft
                </button>
              </span>
            </TooltipTrigger>
            {!MICROSOFT_ENABLED && <TooltipContent>Microsoft sign-in isn’t configured in this build.</TooltipContent>}
          </Tooltip>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-sm text-text-2">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="text-lime hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to {BRAND_NAME}?{' '}
              <Link href="/signup" className="text-lime hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>

        <p className="mt-3 text-xs leading-relaxed text-text-3">
          By continuing you agree to our{' '}
          <Link href="/legal/terms" className="underline hover:text-text-2">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline hover:text-text-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </TooltipProvider>
  );
}
