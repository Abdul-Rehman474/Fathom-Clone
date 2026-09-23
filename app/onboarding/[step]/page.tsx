import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StepShell } from '@/components/onboarding/step-shell';
import {
  AccountTypeStep,
  PreferencesStep,
  AboutYouStep,
  UsageStep,
  ConnectStep,
  FirstCallStep,
} from '@/components/onboarding/steps';
import { ONBOARDING_STEPS, slugStep, type OnboardingStep } from '@/lib/onboarding';

const STEP_LABELS: Record<OnboardingStep, string> = {
  'account-type': 'Get started',
  preferences: 'Set up your preferences',
  'about-you': 'Tell us about yourself',
  usage: 'Personalize your account',
  connect: 'Connect your meeting platforms',
  'first-call': 'You’re all set',
};

const PERSONAL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'proton.me', 'aol.com'];

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: slug } = await params;
  if (!ONBOARDING_STEPS.includes(slug as OnboardingStep)) {
    redirect('/onboarding/account-type');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.onboarding_done) redirect('/calls');

  const { data: settings } = await supabase
    .from('user_settings')
    .select('notes_on, share_with')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: integrations } = await supabase
    .from('integrations')
    .select('provider, account_email')
    .eq('user_id', user.id);

  const email = user.email ?? profile?.email ?? '';
  const stepNum = slugStep(slug);
  const label = STEP_LABELS[slug as OnboardingStep];
  const google = integrations?.find((i) => i.provider === 'google');
  const zoom = integrations?.find((i) => i.provider === 'zoom');

  return (
    <StepShell step={stepNum} label={label} email={email}>
      {slug === 'account-type' && (
        <AccountTypeStep
          email={email}
          isPersonalEmail={PERSONAL_DOMAINS.includes(email.split('@')[1] ?? '')}
        />
      )}
      {slug === 'preferences' && (
        <PreferencesStep notesOn={settings?.notes_on ?? 'all'} shareWith={settings?.share_with ?? 'all'} />
      )}
      {slug === 'about-you' && (
        <AboutYouStep department={profile?.department ?? ''} role={profile?.role ?? ''} />
      )}
      {slug === 'usage' && <UsageStep usage={profile?.usage ?? ''} />}
      {slug === 'connect' && (
        <ConnectStep
          googleConnected={!!google}
          zoomConnected={!!zoom}
          connectedEmail={google?.account_email ?? zoom?.account_email ?? email}
        />
      )}
      {slug === 'first-call' && <FirstCallStep />}
    </StepShell>
  );
}
