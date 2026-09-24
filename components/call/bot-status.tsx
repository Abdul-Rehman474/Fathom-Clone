'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
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
  const active = !!callId && !isTerminal(live.status);

  useEffect(() => {
    if (!active) return;
    let stop = false;
    let last = live;
    const t = setInterval(async () => {
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

/** Bot lifecycle stepper in the editorial divider-row style of the call page. */
export function BotLifecycle({ status, className }: { status: CallStatus; className?: string }) {
  const current = STEPS.findIndex((s) => s.statuses.includes(status));
  return (
    <ol className={cn('border-t border-border', className)} aria-label="Notetaker status">
      {STEPS.map((st, i) => {
        const state = status === 'ready' || i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <li
            key={st.key}
            aria-current={state === 'active' ? 'step' : undefined}
            className="flex items-center justify-between border-b border-border py-3.5"
          >
            <span className={cn('flex items-center gap-2.5', state === 'todo' ? 'text-text-3' : 'text-off-white')}>
              {st.key === 'rec' && state === 'active' && <span className="rec-dot size-2 rounded-full bg-lime" />}
              {st.label}
            </span>
            {state === 'done' && (
              <span className="flex items-center gap-1 text-sm text-lime">
                <Check className="size-3.5" /> Done
              </span>
            )}
            {state === 'active' && st.key !== 'ready' && (
              <span className="flex items-center gap-2 text-sm text-lime">
                {st.key === 'rec' ? 'Live' : <><Loader2 className="size-4 animate-spin" /> In progress</>}
              </span>
            )}
            {state === 'todo' && <span className="text-sm text-text-3">Waiting</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Headline copy for each bot status. */
export function botHeadline(status: CallStatus, botName = 'The notetaker'): { title: string; body: string } {
  switch (status) {
    case 'scheduled':
    case 'joining':
      return { title: `${botName} is joining`, body: 'It usually appears in the meeting within a minute.' };
    case 'waiting_admit':
      return {
        title: 'Waiting to be admitted',
        body: 'The notetaker is in the lobby. Admit it from the meeting to start recording.',
      };
    case 'recording':
      return { title: 'Recording', body: 'The notetaker is in the meeting and recording. Notes arrive when the call ends.' };
    case 'uploading':
    case 'transcribing':
    case 'summarizing':
      return { title: 'Processing', body: 'The meeting has ended. Transcript and summary are on their way.' };
    case 'ready':
      return { title: 'Ready', body: 'Transcript and summary are ready.' };
    case 'failed':
      return { title: 'The notetaker couldn’t record this meeting', body: '' };
  }
}
