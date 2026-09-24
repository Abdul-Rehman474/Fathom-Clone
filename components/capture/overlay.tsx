'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Loader2, Mic, Minimize2, PictureInPicture2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { msToClock } from '@/lib/time';
import { BRAND_NAME } from '@/lib/config';
import { useCaptureSession, type Phase, type Session, type Tag } from '@/components/capture/session';

/* --------------------------------- clock ---------------------------------- */

/** Current time, ticking on the given window's timers (the PiP window when open). */
function useNow(clock: Window | null, everyMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const w = clock ?? window;
    const t = w.setInterval(() => setNow(Date.now()), everyMs);
    return () => w.clearInterval(t);
  }, [clock, everyMs]);
  return now;
}

const PHASE_LABEL: Record<Phase, string> = {
  starting: 'Starting',
  joining: 'Joining',
  waiting: 'Waiting',
  recording: 'Recording',
  ending: 'Ending',
  uploading: 'Uploading',
  processing: 'Processing',
  done: 'Done',
  failed: 'Stopped',
};

function statusLine(s: Session): {
  text: string;
  tone: 'lime' | 'warn' | 'muted' | 'danger';
} {
  const who = s.kind === 'bot' ? 'Notetaker' : 'Tab capture';
  switch (s.phase) {
    case 'starting':
      return {
        text: s.kind === 'bot' ? 'Sending the notetaker…' : 'Pick the meeting tab to share…',
        tone: 'muted',
      };
    case 'joining':
      return { text: 'Notetaker is joining the meeting…', tone: 'muted' };
    case 'waiting':
      return { text: 'Admit the notetaker in your meeting', tone: 'warn' };
    case 'recording':
      return {
        text: s.kind === 'bot' ? `${who}: recording` : 'Capturing this tab',
        tone: 'lime',
      };
    case 'ending':
      return {
        text: s.kind === 'bot' ? 'Notetaker is leaving…' : 'Finishing the recording…',
        tone: 'muted',
      };
    case 'uploading':
      return { text: `Uploading ${s.uploadPct}%`, tone: 'muted' };
    case 'processing':
      return { text: 'Saving the recording…', tone: 'muted' };
    case 'done':
      return { text: 'Done. Your notes are being written.', tone: 'lime' };
    case 'failed':
      return { text: s.error ?? 'The recording stopped.', tone: 'danger' };
  }
}

/* ------------------------------- mic meter -------------------------------- */

function MicMeter({ stream, clock }: { stream: MediaStream | null; clock: Window | null }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const w = clock ?? window;
    const t = w.setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
    }, 90);
    return () => {
      w.clearInterval(t);
      ctx.close().catch(() => {});
    };
  }, [stream, clock]);

  const bars = 12;
  const lit = Math.round(level * bars);
  return (
    <div
      className="flex h-5 items-end gap-[3px]"
      role="meter"
      aria-label="Microphone level"
      aria-valuenow={Math.round(level * 100)}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn('w-[4px] rounded-[1px] transition-colors duration-75', i < lit ? 'bg-lime' : 'bg-surface-3')}
          style={{ height: `${30 + (i / bars) * 70}%` }}
        />
      ))}
    </div>
  );
}

/* -------------------------------- overlay --------------------------------- */

function Overlay({ mode }: { mode: 'pip' | 'docked' }) {
  const s = useCaptureSession();
  const session = s.session!;
  const now = useNow(s.clock);
  const [tab, setTab] = useState<'scratchpad' | 'summary'>('scratchpad');
  const [flash, setFlash] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const elapsed = session.startedAt ? now - session.startedAt : 0;
  const line = statusLine(session);
  const live = session.phase === 'recording';
  const inProgress = ['starting', 'joining', 'waiting', 'recording'].includes(session.phase);

  // Confirm at click time; saving runs in the background so several
  // highlights can be dropped in quick succession.
  async function highlight(tag: Tag) {
    const w = s.clock ?? window;
    setFlash(`${tag.name} at ${msToClock(elapsed)}`);
    w.setTimeout(() => setFlash(null), 2200);
    const r = await s.addHighlight(tag);
    if (!r.ok) {
      setFlash(r.message);
      w.setTimeout(() => setFlash(null), 3500);
    }
  }

  async function end() {
    setEnding(true);
    await s.end();
    setEnding(false);
  }

  return (
    <div className={cn('flex flex-col bg-bg-app text-off-white', mode === 'pip' ? 'h-screen' : 'h-[520px]')}>
      {/* header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-bold tracking-wide">{BRAND_NAME}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em]">
            <span
              className={cn(
                'size-2 rounded-full',
                live ? 'rec-dot bg-danger' : session.phase === 'waiting' ? 'bg-warning' : 'bg-surface-3',
              )}
            />
            {live ? 'Rec' : PHASE_LABEL[session.phase]}
          </span>
          <span className="font-mono text-sm tnum">{msToClock(elapsed)}</span>
          {mode === 'pip' ? (
            <button
              onClick={() => window.focus()}
              className="text-text-3 hover:text-off-white"
              aria-label="Back to the app"
              title="Back to the app"
            >
              <ArrowUpRight className="size-4" />
            </button>
          ) : (
            <span className="flex items-center gap-2">
              {s.pipSupported && (
                <button
                  onClick={s.openOverlay}
                  className="text-text-3 hover:text-lime"
                  aria-label="Pop out above other windows"
                  title="Pop out above other windows"
                >
                  <PictureInPicture2 className="size-4" />
                </button>
              )}
              <button onClick={s.closeOverlay} className="text-text-3 hover:text-off-white" aria-label="Minimise panel">
                <Minimize2 className="size-4" />
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-border px-4 py-2.5">
        <p className="truncate text-sm font-semibold">{session.title}</p>
        <p className="truncate text-xs text-text-3">{session.platformLabel}</p>
      </div>

      {/* status line */}
      {/* CSS animation, not motion: the app tab (and its animation frames) is
          usually hidden while this renders in the PiP window. */}
      <div
        key={line.text}
        className={cn(
          'flex animate-[page-in_0.25s_ease-out_both] items-center gap-2 border-b border-border px-4 py-2.5 text-sm',
          line.tone === 'lime' && 'text-lime',
          line.tone === 'warn' && 'border-l-2 border-l-warning text-warning',
          line.tone === 'danger' && 'text-danger',
          line.tone === 'muted' && 'text-text-2',
        )}
        role="status"
      >
        {['starting', 'joining', 'ending', 'processing', 'uploading'].includes(session.phase) && (
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
        )}
        {session.phase === 'done' && <Check className="size-3.5 shrink-0" />}
        <span className="line-clamp-2">{line.text}</span>
      </div>

      {session.phase === 'uploading' && (
        <div className="h-1 bg-surface-2" aria-hidden>
          <div className="h-full bg-lime transition-[width] duration-300" style={{ width: `${session.uploadPct}%` }} />
        </div>
      )}

      {/* highlight buttons */}
      <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
        {s.tags.map((t) => (
          <button
            key={t.id}
            onClick={() => highlight(t)}
            disabled={!live}
            className="flex items-center gap-2 rounded-btn border border-border px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-[border-color,transform] duration-150 hover:border-lime/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: t.color }} />
            <span className="truncate">{t.name}</span>
          </button>
        ))}
        <p className="col-span-2 h-4 text-xs text-lime" aria-live="polite">
          {flash ?? (live ? '' : 'Highlights unlock once recording starts')}
        </p>
      </div>

      {/* summary / scratchpad */}
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
        <div className="flex gap-5 border-b border-border text-sm" role="tablist">
          {(['scratchpad', 'summary'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                '-mb-px border-b-2 pb-2 capitalize transition-colors',
                tab === k ? 'border-lime text-lime' : 'border-transparent text-text-3 hover:text-text-2',
              )}
            >
              {k}
            </button>
          ))}
        </div>
        {tab === 'scratchpad' ? (
          <div className="flex min-h-0 flex-1 flex-col py-2">
            <textarea
              value={s.scratchpad}
              onChange={(e) => s.setScratchpad(e.target.value)}
              disabled={!session.callId}
              placeholder={
                session.callId ? 'Jot anything down. It saves as you type.' : 'Available once the call starts'
              }
              className="min-h-0 flex-1 resize-none bg-transparent text-sm leading-relaxed text-off-white placeholder:text-text-3 focus:outline-none"
              aria-label="Scratchpad"
            />
            <p className="h-4 text-right text-[11px] text-text-3">
              {s.scratchState === 'saving' && 'Saving…'}
              {s.scratchState === 'saved' && 'Saved'}
              {s.scratchState === 'error' && <span className="text-danger">Not saved. Keep typing to retry.</span>}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 text-sm text-text-2 scroll-styled">
            {s.highlights.length === 0 ? (
              <p>Your summary will be ready right after the call.</p>
            ) : (
              <ul className="space-y-1.5">
                {s.highlights.map((h) => (
                  <li key={h.id} className="flex items-center gap-2">
                    <span className="size-2 rounded-[2px]" style={{ background: h.color }} />
                    <span className="font-mono text-xs text-lime tnum">{msToClock(h.startMs)}</span>
                    <span className="truncate">{h.tagName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        {s.micStream ? (
          <MicMeter stream={s.micStream} clock={s.clock} />
        ) : inProgress ? (
          <button onClick={s.enableMic} className="flex items-center gap-1.5 text-xs text-text-3 hover:text-off-white">
            <Mic className="size-3.5" /> Show mic level
          </button>
        ) : (
          <span />
        )}

        {inProgress && (
          <button
            onClick={end}
            disabled={ending || session.phase === 'starting'}
            className="flex items-center gap-2 rounded-pill border border-danger px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-tint disabled:opacity-50"
          >
            {ending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <span className="size-2 rounded-full bg-danger" />
            )}{' '}
            End
          </button>
        )}
        {session.phase === 'done' && session.callId && (
          <a
            href={`/calls/${session.callId}`}
            target={mode === 'pip' ? '_blank' : undefined}
            rel="noreferrer"
            onClick={() => mode === 'pip' && window.focus()}
            className="rounded-pill bg-lime px-4 py-1.5 text-sm font-semibold text-carbon hover:bg-lime-bright"
          >
            View call
          </a>
        )}
        {session.phase === 'failed' && session.kind === 'tab' && (
          <button
            onClick={s.retryUpload}
            className="rounded-pill bg-lime px-4 py-1.5 text-sm font-semibold text-carbon"
          >
            Retry upload
          </button>
        )}
        {(session.phase === 'failed' || session.phase === 'done') && (
          <button onClick={s.dismiss} className="text-xs text-text-3 hover:text-off-white">
            Close
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the overlay into the Picture-in-Picture window (floating above the
 * meeting) or, where PiP isn't available, as a docked panel in the app.
 */
export function OverlayHost() {
  const s = useCaptureSession();
  const pipBody = s.pipWindow?.document.body ?? null;
  if (!s.session) return null;

  if (pipBody) return createPortal(<Overlay mode="pip" />, pipBody);

  return (
    <AnimatePresence>
      {s.dockedOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 right-4 z-40 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-frame border border-border-strong"
          aria-label="Meeting overlay"
        >
          {s.pipSupported && s.pipRefused && (
            <p className="border-b border-border bg-carbon-soft px-4 py-2 text-xs text-text-2">
              The browser didn’t allow a floating window just then. Use the pop out icon to float it above your meeting.
            </p>
          )}
          {!s.pipSupported && (
            <p className="border-b border-border bg-carbon-soft px-4 py-2 text-xs text-text-2">
              This browser can’t float the overlay above other windows (Chrome and Edge can), so it’s docked here. Keep
              this tab open while you record.
            </p>
          )}
          <Overlay mode="docked" />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Slim bar under the top bar while a session is live; reopens the overlay (FR-4.1). */
export function RecordingBar() {
  const s = useCaptureSession();
  const now = useNow(s.clock);
  const session = s.session;
  if (!session) return null;
  const live = session.phase === 'recording';
  const inProgress = ['starting', 'joining', 'waiting', 'recording'].includes(session.phase);
  const overlayVisible = !!s.pipWindow || s.dockedOpen;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="sticky top-16 z-20 overflow-hidden border-b border-border bg-carbon-soft"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-8">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
          <span
            className={cn(
              'size-2 rounded-full',
              live ? 'rec-dot bg-danger' : session.phase === 'waiting' ? 'bg-warning' : 'bg-lime',
            )}
          />
          {live ? 'Recording' : PHASE_LABEL[session.phase]}
        </span>
        {session.startedAt && inProgress && (
          <span className="font-mono text-sm tnum">{msToClock(now - session.startedAt)}</span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm text-text-2">
          {session.title}
          {session.phase === 'uploading' && ` · ${session.uploadPct}%`}
        </span>
        <div className="flex items-center gap-2">
          {!overlayVisible && (
            <button
              onClick={s.openOverlay}
              className="flex items-center gap-1.5 rounded-pill border border-border-strong px-3 py-1 text-xs font-semibold hover:border-lime/60 hover:text-lime"
            >
              <PictureInPicture2 className="size-3.5" /> {s.pipSupported ? 'Pop out overlay' : 'Show overlay'}
            </button>
          )}
          {inProgress && (
            <button
              onClick={() => s.end()}
              className="rounded-pill border border-danger px-3 py-1 text-xs font-semibold text-danger hover:bg-danger-tint"
            >
              End
            </button>
          )}
          {session.phase === 'done' && session.callId && (
            <a
              href={`/calls/${session.callId}`}
              className="rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-carbon"
            >
              View call
            </a>
          )}
          {!inProgress && (
            <button onClick={s.dismiss} className="text-text-3 hover:text-off-white" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      {s.recorderError && session.phase === 'starting' && (
        <p className="px-4 pb-2 text-xs text-danger md:px-8">{s.recorderError}</p>
      )}
    </motion.div>
  );
}
