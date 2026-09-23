import { redirect } from 'next/navigation';
import { getProfileAndSettings } from '@/lib/queries';
import { postAuthPath } from '@/lib/onboarding';
import { TopBar } from '@/components/app/top-bar';
import { AppTabs } from '@/components/app/app-tabs';
import { Toaster } from '@/components/ui/toaster';

/** Signed-in app shell (UI.md §4): top bar + tabs + page + Ask panel. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getProfileAndSettings();
  if (!user) redirect('/login');
  // Force new users through onboarding first.
  if (profile && !profile.onboarding_done) {
    redirect(postAuthPath(false, profile.onboarding_step ?? 1));
  }

  const name = profile?.full_name ?? user.email?.split('@')[0] ?? 'You';
  const email = user.email ?? profile?.email ?? '';

  return (
    <div className="flex min-h-screen flex-col bg-bg-app">
      <TopBar
        name={name}
        email={email}
        inviteCode={profile?.invite_code ?? ''}
        credits={profile?.credits ?? 25}
      />
      <AppTabs />
      <div className="flex flex-1">
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
