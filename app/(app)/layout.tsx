import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getProfileAndSettings } from '@/lib/queries';
import { postAuthPath } from '@/lib/onboarding';
import { AppShell } from '@/components/app/app-shell';
import { Toaster } from '@/components/ui/toaster';

/** Signed-in app shell (Carbon + Lime): left sidebar + slim top bar. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getProfileAndSettings();
  if (!user) redirect('/login');
  if (profile && !profile.onboarding_done) {
    redirect(postAuthPath(false, profile.onboarding_step ?? 1));
  }

  const name = profile?.full_name ?? user.email?.split('@')[0] ?? 'You';
  const email = user.email ?? profile?.email ?? '';

  return (
    <>
      <Suspense>
        <AppShell
          name={name}
          email={email}
          credits={profile?.credits ?? 25}
          inviteCode={profile?.invite_code ?? ''}
        >
          {children}
        </AppShell>
      </Suspense>
      <Toaster />
    </>
  );
}
