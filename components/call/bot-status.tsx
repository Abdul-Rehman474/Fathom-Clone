'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_OUT } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { isTerminal } from '@/lib/pipeline/status';
import type { CallStatus } from '@/lib/types';

export interface LiveStatus {
  status: CallStatus;
  error: string | null;
  failedStage: string | null;
}

/**
 * Polls `/api/calls/:id/status` while the call is active and stops once it
 * reaches `ready` or `failed` (PRD FR-3.2). `onChange` fires on each change.
 */
export function useLiveStatus(
  callId: string | null,
  initial: LiveStatus,
  { intervalMs = 3000, onChange }: { intervalMs?: number; onChange?: (s: LiveStatus) => void } = {},
): [LiveStatus, (s: LiveStatus) => void] {
  const [live, setLive] = useState<LiveStatus>(initial);
  // `scheduled` means no bot was sent yet: nothing changes until the user acts.
  const active = !!callId && !isTerminal(live.status) && live.status !== 'scheduled';

  useEffect(() => {
    if (!active) return;
    let stop = false;
    let last = live;
    const t = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/api/calls/${callId}/status`, { cache: 'no-store' });
        if (!res.ok || stop) return;
        const next = (await res.json()) as LiveStatus;
        if (next.status === last.status && next.error === last.error) return;
        last = next;
        setLive(next);
        onChange?.(next);
      } catch {
        // Network blip: try again on the next tick.
      }
    }, intervalMs);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [active, callId, intervalMs, onChange, live]);

  return [live, setLive];
}

const STEPS: { key: string; label: string; statuses: CallStatus[] }[] = [
  { key: 'join', label: 'Joining', statuses: ['scheduled', 'joining'] },
  { key: 'admit', label: 'Waiting to be admitted', statuses: ['waiting_admit'] },
  { key: 'rec', label: 'Recording', statuses: ['recording'] },
  { key: 'proc', label: 'Processing', statuses: ['uploading', 'transcribing', 'summarizing'] },
  { key: 'ready', label: 'Ready', statuses: ['ready'] },
];

/** Bot lifecycle stepper: a lime rail fills to the current step as the bot moves. */
export function BotLifecycle({ status, className }: { status: CallStatus; className?: string }) {
  const current = status === 'ready' ? STEPS.length - 1 : STEPS.findIndex((s) => s.statuses.includes(status));
  const fill = STEPS.length > 1 ? Math.max(0, current) / (STEPS.length - 1) : 0;
  return (
    <div className={cn('relative', className)}>
      {/* rail */}
      <div className="absolute bottom-6 left-[7px] top-6 w-px bg-border" aria-hidden />
      <motion.div
        className="absolute left-[7px] top-6 w-px origin-top bg-lime"
        style={{ bottom: '1.5rem' }}
        initial={false}
        animate={{ scaleY: fill }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        aria-hidden
      />
      <ol aria-label="Notetaker status">
        {STEPS.map((st, i) => {
          const state = status === 'ready' || i < current ? 'done' : i === current ? 'active' : 'todo';
          return (
            <li
              key={st.key}
              aria-current={state === 'active' ? 'step' : undefined}
              className="relative flex items-center justify-between py-3 pl-8"
            >
              <span className="absolute left-0 top-1/2 flex size-[15px] -translate-y-1/2 items-center justify-center">
                <motion.span
                  className={cn(
                    'block rounded-full',
                    state === 'todo' ? 'size-[7px] bg-surface-3' : 'size-[9px] bg-lime',
                    state === 'active' && 'rec-dot',
                  )}
                  initial={false}
                  animate={{ scale: state === 'active' ? 1.25 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                />
              </span>
              <span
                className={cn('transition-colors duration-300', state === 'todo' ? 'text-text-3' : 'text-off-white')}
              >
                {st.label}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={state}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex items-center gap-1.5 text-sm', state === 'todo' ? 'text-text-3' : 'text-lime')}
                >
                  {state === 'done' && (
                    <>
                      <Check className="size-3.5" /> Done
                    </>
                  )}
                  {state === 'active' && st.key === 'rec' && 'Live'}
                  {state === 'active' && st.key !== 'rec' && st.key !== 'ready' && (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Now
                    </>
                  )}
                  {state === 'todo' && 'Next'}
                </motion.span>
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Headline copy for each bot status. */
export function botHeadline(status: CallStatus, botName = 'The notetaker'): { title: string; body: string } {
  switch (status) {
    case 'scheduled':
      return {
        title: 'No notetaker sent yet',
        body: 'Send one when your meeting is about to start and it will ask to join.',
      };
    case 'joining':
      return { title: `${botName} is on its way`, body: 'It normally shows up in the meeting within a minute.' };
    case 'waiting_admit':
      return {
        title: 'Waiting to be admitted',
        body: 'The notetaker is in the lobby. Let it in from your meeting and it starts recording.',
      };
    case 'recording':
      return { title: 'Recording', body: 'The notetaker is in the call. Your notes arrive once the meeting ends.' };
    case 'uploading':
    case 'transcribing':
    case 'summarizing':
      return {
        title: 'Writing up your notes',
        body: 'The meeting has ended. The transcript and summary take about a minute.',
      };
    case 'ready':
      return { title: 'Your notes are ready', body: 'Open the call to read the transcript and summary.' };
    case 'failed':
      return { title: 'The notetaker couldn’t record this meeting', body: '' };
  }
}
