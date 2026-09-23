'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BrandMark } from '@/components/brand';
import { ONBOARDING_TOTAL } from '@/lib/onboarding';

/** Onboarding shell (designPlan §6, UI.md §3): logo, cyan progress bar, footer. */
export function StepShell({
  step,
  label,
  email,
  children,
}: {
  step: number;
  label: string;
  email: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-bg-app">
      {/* solid 2px cyan progress bar at the top edge */}
      <div
        className="fixed inset-x-0 top-0 z-10 h-0.5 bg-cyan transition-[width]"
        style={{ width: `${(step / ONBOARDING_TOTAL) * 100}%` }}
        aria-hidden
      />
      <div className="flex justify-center pt-10">
        <BrandMark href={null} />
      </div>

      <main className="mx-auto flex max-w-[900px] flex-col items-center px-6 pb-32 pt-12 text-center">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.06em] text-text-3">{label}</p>
        {children}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-bg-app py-4 text-center text-sm text-text-3">
        👤 Signing up as <span className="text-text-2">{email}</span>. Wrong account?{' '}
        <button onClick={signOut} className="text-cyan hover:underline">
          Sign out
        </button>
      </footer>
    </div>
  );
}
