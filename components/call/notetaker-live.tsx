'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw, UserMinus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { BotLifecycle, botHeadline, useLiveStatus, type LiveStatus } from '@/components/call/bot-status';

/**
 * Live notetaker status for one call (PRD FR-3.2): headline, lifecycle
 * stepper, failure reason with retry, and Remove. Used on the call page and
 * as the New Meeting result. Polls only while the call is active.
 */
export function NotetakerLive({
  callId,
  initial,
  variant = 'page',
}: {
  callId: string;
  initial: LiveStatus;
  variant?: 'page' | 'dialog';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'retry' | 'remove' | null>(null);
  const onChange = useCallback(
    (s: LiveStatus) => {
      // The call page swaps to the finished call once it's ready.
      if (variant === 'page' && s.status === 'ready') router.refresh();
    },
    [router, variant],
  );
  const [live, setLive] = useLiveStatus(callId, initial, { onChange });
  const { status, error } = live;
  const head = botHeadline(status);
  const failed = status === 'failed';
  const inMeeting =
    status === 'joining' || status === 'waiting_admit' || status === 'recording' || status === 'scheduled';

  async function retry() {
    setBusy('retry');
    const res = await fetch(`/api/calls/${callId}/retry`, { method: 'POST' }).catch(() => null);
    setBusy(null);
    if (res?.ok) {
      toast.success('Notetaker sent again');
      setLive({ status: 'joining', error: null, failedStage: null });
    } else toast.error((await messageOf(res)) ?? 'Could not send the notetaker. Try again.');
  }

  async function remove() {
    setBusy('remove');
    const res = await fetch(`/api/calls/${callId}/notetaker`, { method: 'DELETE' }).catch(() => null);
    setBusy(null);
    if (res?.ok) toast.success('Notetaker is leaving the meeting');
    else toast.error((await messageOf(res)) ?? 'Could not remove the notetaker. Try again.');
  }

  return (
    <div aria-live="polite">
      <p className={failed ? 'micro-label mb-3 !text-danger' : 'micro-label mb-3'}>
        {failed ? 'Notetaker stopped' : 'Notetaker'}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${status}:${error ?? ''}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className={
              variant === 'page'
                ? 'font-display text-3xl font-semibold tracking-tight'
                : 'font-display text-2xl font-semibold tracking-tight'
            }
          >
            {head.title}
          </h2>
          <p className="mt-3 text-text-2">
            {failed ? (error ?? 'The notetaker could not record this meeting.') : head.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {!failed && <BotLifecycle status={status} className="mt-8" />}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {failed && (
          <Button onClick={retry} disabled={busy !== null}>
            {busy === 'retry' ? <Loader2 className="animate-spin" /> : <RotateCcw />} Send notetaker again
          </Button>
        )}
        {inMeeting && (
          <Button variant="outline" onClick={remove} disabled={busy !== null}>
            {busy === 'remove' ? <Loader2 className="animate-spin" /> : <UserMinus />} Remove notetaker
          </Button>
        )}
        {variant === 'dialog' ? (
          <Link
            href={`/calls/${callId}`}
            className="inline-flex h-10 items-center px-2 text-sm text-lime hover:underline"
          >
            Open call →
          </Link>
        ) : (
          <Link href="/calls" className="inline-flex h-10 items-center px-2 text-sm text-text-2 hover:text-off-white">
            Back to My Calls
          </Link>
        )}
      </div>
    </div>
  );
}

async function messageOf(res: Response | null): Promise<string | undefined> {
  if (!res) return 'That did not go through. Check your connection.';
  const json = (await res.json().catch(() => ({}))) as { message?: string };
  return json.message;
}
