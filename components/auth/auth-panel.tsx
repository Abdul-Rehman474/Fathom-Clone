'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BRAND_NAME } from '@/lib/config';
import { Toaster, toast } from '@/components/ui/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MICROSOFT_ENABLED = process.env.NEXT_PUBLIC_MICROSOFT_ENABLED === 'true';

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

export function AuthPanel({ mode }: { mode: 'signin' | 'signup' }) {
  const params = useSearchParams();
  const next = params.get('next') ?? '/calls';
  const [loading, setLoading] = useState<null | 'google'>(null);

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
      toast.error(
        e instanceof Error && e.message
          ? e.message
          : 'Could not start Google sign-in. Check that Supabase auth is configured.',
      );
    }
  }

  const title = mode === 'signup' ? `Sign up for ${BRAND_NAME}` : 'Welcome back';

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-frame border border-border bg-surface-1 p-8">
        <div className="mb-6 text-4xl" aria-hidden>
          🚀
        </div>
        <h1 className="text-2xl font-semibold text-text-1">{title}</h1>
        <p className="mt-1 text-sm text-text-2">
          Connect your work email to get started in minutes.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading !== null}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-btn bg-white text-base font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading === 'google' ? <Loader2 className="size-5 animate-spin" /> : <GoogleGlyph />}
            Continue with Google
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block">
                <button
                  type="button"
                  disabled={!MICROSOFT_ENABLED}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-btn bg-white text-base font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="grid size-5 grid-cols-2 gap-0.5" aria-hidden>
                    <span className="bg-[#F25022]" />
                    <span className="bg-[#7FBA00]" />
                    <span className="bg-[#00A4EF]" />
                    <span className="bg-[#FFB900]" />
                  </span>
                  Continue with Microsoft
                </button>
              </span>
            </TooltipTrigger>
            {!MICROSOFT_ENABLED && (
              <TooltipContent>Microsoft sign-in isn’t configured in this build.</TooltipContent>
            )}
          </Tooltip>
        </div>

        <p className="mt-6 text-sm text-text-2">
          {mode === 'signup' ? (
            <>
              Already have a {BRAND_NAME} account?{' '}
              <Link href="/login" className="text-cyan hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to {BRAND_NAME}?{' '}
              <Link href="/signup" className="text-cyan hover:underline">
                Sign up free
              </Link>
            </>
          )}
        </p>

        <p className="mt-4 text-xs text-text-3">
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
      <Toaster />
    </TooltipProvider>
  );
}

/** Right-hand marketing quote (UI.md §2). */
export function AuthQuote() {
  return (
    <div className="hidden lg:block">
      <div className="font-display text-7xl leading-none text-surface-3" aria-hidden>
        &ldquo;
      </div>
      <p className="-mt-6 max-w-md font-display text-2xl font-light leading-snug text-text-1">
        &ldquo;Work smarter, not harder,&rdquo; they said.
        <br />
        <span className="font-semibold text-orange">{BRAND_NAME} took it personally.</span>
      </p>
      <p className="mt-6 text-sm text-text-3">Sample testimonial · Product team</p>
    </div>
  );
}
