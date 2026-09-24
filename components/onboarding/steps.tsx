'use client';

import { useState } from 'react';
import { User, Users, Video, Upload, Bot, Check } from 'lucide-react';
import { ChoiceCard } from '@/components/ui/choice-card';
import { SentenceSelect } from '@/components/ui/sentence-select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SubmitButton } from '@/components/onboarding/submit-button';
import { BRAND_NAME } from '@/lib/config';
import {
  saveAccountType,
  savePreferences,
  saveAboutYou,
  saveUsage,
  advanceToFirstCall,
  finishOnboarding,
} from '@/app/onboarding/actions';

const continueBtn =
  'h-11 w-[450px] max-w-full rounded-btn font-semibold transition-colors';
const enabled = 'bg-lime text-carbon hover:bg-lime-bright hover:-translate-y-px';
const disabled = 'bg-surface-2 text-text-3 cursor-not-allowed';

/* --------------------------------- Step 1 -------------------------------- */
export function AccountTypeStep({ email, isPersonalEmail }: { email: string; isPersonalEmail: boolean }) {
  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
        Are your meetings on your company calendar?
      </h1>
      <p className="mt-4 text-lg text-muted">We recommend using your work email.</p>
      {isPersonalEmail && (
        <p className="mt-2 text-sm text-text-3">
          <span className="text-text-2">{email}</span> looks like a personal email
        </p>
      )}

      {/* One form per choice: a hidden input carries the value, because a
          server-action `formAction` overrides a button's `name`. */}
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
        <form action={saveAccountType} className="flex flex-col gap-4 rounded-card border border-border bg-surface-1 p-6">
          <input type="hidden" name="account_type" value="personal" />
          <div className="font-display text-lg font-semibold">Personal use only</div>
          <p className="text-sm text-text-3">Suited for one-off calls</p>
          <ul className="space-y-2 text-sm text-text-2">
            <li>— View only your own meetings</li>
            <li>— No shared workspace</li>
            <li>— Cannot convert to a team plan later</li>
          </ul>
          <SubmitButton
            pendingLabel="Saving…"
            className="mt-auto h-10 rounded-btn border border-border-strong font-semibold text-text-1 transition-colors hover:border-off-white"
          >
            Continue with Personal Email
          </SubmitButton>
        </form>

        <form action={saveAccountType} className="flex flex-col gap-4 rounded-card border border-lime/50 bg-surface-1 p-6">
          <input type="hidden" name="account_type" value="team" />
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-lg font-semibold">Individual or Team use</span>
            <span className="micro-label !text-lime">Recommended</span>
          </div>
          <ul className="space-y-2 text-sm text-text-2">
            <li><span className="text-lime">✓</span> Set individual and team preferences</li>
            <li><span className="text-lime">✓</span> Create private and shared workspaces</li>
            <li><span className="text-lime">✓</span> Add teammates anytime</li>
          </ul>
          <SubmitButton
            pendingLabel="Saving…"
            className="mt-auto h-10 rounded-btn bg-lime font-semibold text-carbon transition-all hover:-translate-y-px hover:bg-lime-bright"
          >
            Continue with Work Email
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

/* --------------------------------- Step 2 -------------------------------- */
const NOTES_ON = [
  { value: 'all', label: 'All meetings in my calendar' },
  { value: 'host', label: 'Only meetings I host' },
  { value: 'external', label: 'Only external meetings' },
  { value: 'none', label: 'None' },
];
const SHARE_WITH = [
  { value: 'all', label: 'All attendees' },
  { value: 'internal', label: 'Only internal attendees' },
  { value: 'me', label: 'Only me' },
];

export function PreferencesStep({ notesOn, shareWith }: { notesOn: string; shareWith: string }) {
  const [notes, setNotes] = useState(notesOn || 'all');
  const [share, setShare] = useState(shareWith || 'all');
  const [consent, setConsent] = useState(false);

  return (
    <form action={savePreferences} className="w-full">
      <input type="hidden" name="notes_on" value={notes} />
      <input type="hidden" name="share_with" value={share} />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Set up your preferences</h1>
      <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-text-1">
        Take notes on{' '}
        <SentenceSelect value={notes} onValueChange={setNotes} options={NOTES_ON} /> and share with{' '}
        <SentenceSelect value={share} onValueChange={setShare} options={SHARE_WITH} />.
      </p>

      <label className="mx-auto mt-10 flex max-w-xl cursor-pointer items-start gap-3 text-left text-sm text-text-2">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span>
          I understand I&apos;m responsible for collecting attendee consent for the recording and
          transcription, in accordance with applicable laws.
        </span>
      </label>

      <div className="mt-8 flex justify-center">
        <SubmitButton pendingLabel="Saving…" disabled={!consent} className={cn(continueBtn, consent ? enabled : disabled)}>
          Continue
        </SubmitButton>
      </div>
    </form>
  );
}

/* --------------------------------- Step 3 -------------------------------- */
const DEPARTMENTS = ['Sales', 'Customer Success', 'Marketing', 'Product', 'Engineering', 'Design', 'Operations', 'HR', 'Finance', 'Leadership', 'Other'];
const ROLES = ['Individual Contributor', 'Manager', 'Director', 'VP', 'C-Level/Founder', 'Consultant', 'Student'];
const toOpts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

export function AboutYouStep({ department, role }: { department: string; role: string }) {
  const [dep, setDep] = useState(department || '');
  const [rol, setRol] = useState(role || '');
  const ready = dep && rol;
  return (
    <form action={saveAboutYou} className="w-full">
      <input type="hidden" name="department" value={dep} />
      <input type="hidden" name="role" value={rol} />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Tell us about yourself</h1>
      <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-text-1">
        I work in{' '}
        <SentenceSelect value={dep} onValueChange={setDep} options={toOpts(DEPARTMENTS)} placeholder="Select Department" />{' '}
        as{' '}
        <SentenceSelect value={rol} onValueChange={setRol} options={toOpts(ROLES)} placeholder="Select Your Role" />.
      </p>
      <div className="mt-10 flex justify-center">
        <SubmitButton pendingLabel="Saving…" disabled={!ready} className={cn(continueBtn, ready ? enabled : disabled)}>
          Continue
        </SubmitButton>
      </div>
    </form>
  );
}

/* --------------------------------- Step 4 -------------------------------- */
export function UsageStep({ usage }: { usage: string }) {
  const [choice, setChoice] = useState(usage || '');
  return (
    <form action={saveUsage} className="w-full">
      <input type="hidden" name="usage" value={choice} />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">How are you planning to use {BRAND_NAME}?</h1>
      <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
        <ChoiceCard selected={choice === 'solo'} onSelect={() => setChoice('solo')} icon={<User />} title="By Myself" />
        <ChoiceCard selected={choice === 'team'} onSelect={() => setChoice('team')} icon={<Users />} title="With My Team">
          Creates a shared workspace
        </ChoiceCard>
      </div>
      <div className="mt-10 flex justify-center">
        <SubmitButton pendingLabel="Saving…" disabled={!choice} className={cn(continueBtn, choice ? enabled : disabled)}>
          Continue
        </SubmitButton>
      </div>
    </form>
  );
}

/* --------------------------------- Step 5 -------------------------------- */
function ConnectRow({
  name,
  connected,
  provider,
  connectedEmail,
}: {
  name: string;
  connected: boolean;
  provider?: 'google' | 'zoom';
  connectedEmail: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-surface-1 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-btn bg-white font-bold text-black">
          {name[0]}
        </div>
        <span className="font-medium">{name}</span>
      </div>
      {connected ? (
        <span className="flex items-center gap-1 text-sm text-success">
          <Check className="size-4" /> Connected as {connectedEmail}
        </span>
      ) : provider ? (
        <a
          href={`/api/integrations/${provider}/start?next=/onboarding/connect`}
          className="rounded-btn bg-cyan-tint px-3 py-1.5 text-sm font-semibold text-cyan hover:brightness-125"
        >
          Connect
        </a>
      ) : (
        <span className="flex items-center gap-1 text-sm text-success">
          <Check className="size-4" /> No connection needed
        </span>
      )}
    </div>
  );
}

export function ConnectStep({
  googleConnected,
  zoomConnected,
  connectedEmail,
}: {
  googleConnected: boolean;
  zoomConnected: boolean;
  connectedEmail: string;
}) {
  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Connect your meeting platforms</h1>
      <p className="mt-3 text-text-2">
        Connect a platform so {BRAND_NAME} can create meetings and send your notetaker.
      </p>
      <div className="mx-auto mt-8 max-w-lg space-y-3 text-left">
        <ConnectRow name="Google Meet" connected={googleConnected} provider="google" connectedEmail={connectedEmail} />
        <ConnectRow name="Zoom" connected={zoomConnected} provider="zoom" connectedEmail={connectedEmail} />
        <ConnectRow name="Microsoft Teams" connected={false} connectedEmail={connectedEmail} />
        <p className="pl-1 text-xs text-text-3">Paste any Teams link — no connection needed.</p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <form action={advanceToFirstCall}>
          <SubmitButton pendingLabel="Saving…" className={cn(continueBtn, enabled)}>
            Continue
          </SubmitButton>
        </form>
        <form action={advanceToFirstCall}>
          <SubmitButton className="text-sm text-text-3 hover:text-text-2">
            Skip this step
          </SubmitButton>
        </form>
      </div>
      <p className="mx-auto mt-8 max-w-lg text-sm text-text-3">
        Don&apos;t worry, {BRAND_NAME} will only join the meetings that you ask it to. You&apos;re in
        control here.
      </p>
    </div>
  );
}

/* --------------------------------- Step 6 -------------------------------- */
export function FirstCallStep() {
  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Capture your first meeting</h1>

      <form action={finishOnboarding} className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        <SubmitButton className="flex flex-col items-center gap-3 rounded-frame border border-border bg-surface-1 p-6 hover:bg-surface-2">
          <Bot className="size-5 text-lime" />
          <span className="font-semibold">Send notetaker to a meeting</span>
          <span className="text-sm text-text-3">Paste a Meet / Zoom / Teams link</span>
        </SubmitButton>
        <SubmitButton className="flex flex-col items-center gap-3 rounded-frame border border-border bg-surface-1 p-6 hover:bg-surface-2">
          <Video className="size-5 text-lime" />
          <span className="font-semibold">Record a browser tab</span>
          <span className="rounded-chip bg-surface-2 px-2 py-0.5 text-xs text-text-3">Chrome / Edge</span>
        </SubmitButton>
        <SubmitButton className="flex flex-col items-center gap-3 rounded-frame border border-border bg-surface-1 p-6 hover:bg-surface-2">
          <Upload className="size-5 text-lime" />
          <span className="font-semibold">Upload a recording</span>
          <span className="text-sm text-text-3">Audio or video file</span>
        </SubmitButton>
      </form>

      <div className="mt-8">
        <form action={finishOnboarding}>
          <SubmitButton className="text-cyan hover:underline">
            Go to My Calls →
          </SubmitButton>
        </form>
      </div>
      <p className="mt-6 text-sm text-text-3">
        {BRAND_NAME} runs fully in your browser — nothing to install.
      </p>
    </div>
  );
}
