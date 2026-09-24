'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createCall, uploadToCall } from '@/lib/capture-client';
import { useTabRecorder, type TabRecorderResult } from '@/components/capture/use-tab-recorder';
import type { CallStatus } from '@/lib/types';

/**
 * One live capture session (tab recording or notetaker bot) shared by the
 * overlay, the recording status bar and the New Meeting dialog
 * (architecture.md §7). The overlay is a React portal, so all of them read
 * the same state with no messaging between windows.
 */

export type Phase =
  'starting' | 'joining' | 'waiting' | 'recording' | 'ending' | 'uploading' | 'processing' | 'done' | 'failed';

export interface Session {
  kind: 'tab' | 'bot';
  callId: string | null;
  title: string;
  platformLabel: string;
  phase: Phase;
  /** Recording start (epoch ms); timer and highlight offsets use it. */
  startedAt: number | null;
  uploadPct: number;
  error: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface OverlayHighlight {
  id: string;
  tagName: string;
  color: string;
  startMs: number;
}

interface Ctx {
  session: Session | null;
  tags: Tag[];
  highlights: OverlayHighlight[];
  scratchpad: string;
  scratchState: 'idle' | 'saving' | 'saved' | 'error';
  micStream: MediaStream | null;
  pipSupported: boolean;
  pipWindow: Window | null;
  dockedOpen: boolean;
  /** The browser supports PiP but refused a window (no user gesture left). */
  pipRefused: boolean;
  /** Timers run on the PiP window when it's open: the app tab is usually hidden then. */
  clock: Window | null;
  openOverlay: () => void;
  closeOverlay: () => void;
  startTab: (opts: { captureVideo: boolean; title?: string }) => Promise<boolean>;
  beginBot: (opts: { title: string; platformLabel: string; openOverlay?: boolean }) => void;
  attachBot: (callId: string) => void;
  failBot: (message: string) => void;
  end: () => Promise<void>;
  retryUpload: () => Promise<void>;
  dismiss: () => void;
  addHighlight: (tag: Tag) => Promise<{ ok: boolean; message: string }>;
  setScratchpad: (text: string) => void;
  enableMic: () => Promise<void>;
  recorderError: string | null;
}

const SessionContext = createContext<Ctx | null>(null);

export function useCaptureSession(): Ctx {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useCaptureSession must be used inside <CaptureSessionProvider>');
  return ctx;
}

const TERMINAL: Phase[] = ['done', 'failed'];

function phaseFor(status: CallStatus): Phase {
  switch (status) {
    case 'scheduled':
    case 'joining':
      return 'joining';
    case 'waiting_admit':
      return 'waiting';
    case 'recording':
      return 'recording';
    case 'uploading':
      return 'processing';
    case 'failed':
      return 'failed';
    default:
      return 'done'; // transcribing, summarizing, ready: capture is finished
  }
}

/** Copy the app's styles into the PiP document so the design system applies. */
function adoptStyles(target: Document) {
  const base = target.createElement('base');
  base.href = window.location.origin + '/';
  target.head.appendChild(base);
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.href) {
      // Linked sheets keep their own URL so relative font paths still resolve.
      const link = target.createElement('link');
      link.rel = 'stylesheet';
      link.href = sheet.href;
      target.head.appendChild(link);
      continue;
    }
    try {
      const style = target.createElement('style');
      style.textContent = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join('\n');
      target.head.appendChild(style);
    } catch {
      // Cross-origin sheet without href: nothing we can copy.
    }
  }
  target.documentElement.className = document.documentElement.className;
  target.body.className = 'bg-bg-app text-off-white antialiased';
  target.title = 'FATHOM notes';
}

export function CaptureSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [highlights, setHighlights] = useState<OverlayHighlight[]>([]);
  const [scratchpad, setScratchText] = useState('');
  const [scratchState, setScratchState] = useState<Ctx['scratchState']>('idle');
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [dockedOpen, setDockedOpen] = useState(false);
  const [pipRefused, setPipRefused] = useState(false);
  const [botMic, setBotMic] = useState<MediaStream | null>(null);
  const [pipSupported, setPipSupported] = useState(false);

  const recorder = useTabRecorder();
  const sessionRef = useRef<Session | null>(null);
  const lastBlob = useRef<TabRecorderResult | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Resolves with the tab call's id once the row exists (it's created as recording starts). */
  const callIdReady = useRef<Promise<string | null>>(Promise.resolve(null));

  const update = useCallback((patch: Partial<Session> | ((s: Session) => Partial<Session>)) => {
    setSession((s) => {
      if (!s) return s;
      const next = {
        ...s,
        ...(typeof patch === 'function' ? patch(s) : patch),
      };
      sessionRef.current = next;
      return next;
    });
  }, []);

  const replace = useCallback((s: Session | null) => {
    sessionRef.current = s;
    setSession(s);
  }, []);

  // Feature detection has to wait for the browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPipSupported('documentPictureInPicture' in window);
  }, []);

  // Highlight tags from Settings, one button each (FR-4.2).
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('highlight_tags')
      .select('id, name, color, position')
      .order('position')
      .then(({ data }) => setTags((data ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color }))));
  }, []);

  // After a reload, pick a live notetaker back up so it can still be ended.
  useEffect(() => {
    const supabase = createClient();
    const since = new Date(Date.now() - 4 * 3600_000).toISOString();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('calls')
        .select('id, title, platform, status, recording_started_at, scratchpad')
        .eq('owner_id', user.id)
        .eq('source', 'bot')
        .in('status', ['scheduled', 'joining', 'waiting_admit', 'recording'])
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1);
      const c = data?.[0];
      if (!c || sessionRef.current) return;
      setScratchText(c.scratchpad ?? '');
      replace({
        kind: 'bot',
        callId: c.id,
        title: c.title ?? 'Meeting',
        platformLabel: PLATFORM[c.platform as string] ?? 'Meeting',
        phase: phaseFor(c.status as CallStatus),
        startedAt: c.recording_started_at ? Date.parse(c.recording_started_at) : null,
        uploadPct: 0,
        error: null,
      });
    })();
  }, [replace]);

  /* ------------------------------ overlay window ----------------------------- */

  const openOverlay = useCallback(() => {
    if (!('documentPictureInPicture' in window)) {
      setDockedOpen(true);
      return;
    }
    if (pipWindow) {
      pipWindow.focus();
      return;
    }
    // Must run inside a user gesture; callers invoke it synchronously from a click.
    const dpip = (window as unknown as { documentPictureInPicture: DocumentPiP }).documentPictureInPicture;
    dpip
      .requestWindow({ width: 340, height: 560 })
      .then((win) => {
        adoptStyles(win.document);
        win.addEventListener('pagehide', () => setPipWindow(null));
        setPipWindow(win);
        setDockedOpen(false);
        setPipRefused(false);
      })
      .catch(() => {
        // No user gesture left (e.g. after a slow request): use the docked
        // panel now; the status bar offers "Pop out" on the next click.
        setPipRefused(true);
        setDockedOpen(true);
      });
  }, [pipWindow]);

  const closeOverlay = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
    setDockedOpen(false);
  }, [pipWindow]);

  /* ---------------------------------- bot ---------------------------------- */

  const beginBot = useCallback(
    (opts: { title: string; platformLabel: string; openOverlay?: boolean }) => {
      if (opts.openOverlay !== false) openOverlay();
      setHighlights([]);
      setScratchText('');
      setScratchState('idle');
      replace({
        kind: 'bot',
        callId: null,
        title: opts.title,
        platformLabel: opts.platformLabel,
        phase: 'starting',
        startedAt: null,
        uploadPct: 0,
        error: null,
      });
    },
    [openOverlay, replace],
  );

  const attachBot = useCallback((callId: string) => update({ callId, phase: 'joining' }), [update]);
  const failBot = useCallback((message: string) => update({ phase: 'failed', error: message }), [update]);

  // Poll the bot while it's live, on the PiP window's timers when open.
  const clock = pipWindow ?? (typeof window === 'undefined' ? null : window);
  const botCallId = session?.kind === 'bot' ? session.callId : null;
  const botActive = !!botCallId && !TERMINAL.includes(session?.phase ?? 'done');
  useEffect(() => {
    if (!botActive || !botCallId || !clock) return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/calls/${botCallId}/status`, {
          cache: 'no-store',
        });
        if (!res.ok || stop) return;
        const s = (await res.json()) as {
          status: CallStatus;
          error: string | null;
          recordingStartedAt: string | null;
        };
        update((cur) => {
          const phase = phaseFor(s.status);
          return {
            // Keep "Ending…" on screen until the bot has actually left.
            phase: cur.phase === 'ending' && phase === 'recording' ? 'ending' : phase,
            error: s.error,
            startedAt: s.recordingStartedAt ? Date.parse(s.recordingStartedAt) : cur.startedAt,
          };
        });
      } catch {
        // Network blip: next tick retries.
      }
    };
    poll();
    const t = clock.setInterval(poll, 3000);
    return () => {
      stop = true;
      clock.clearInterval(t);
    };
  }, [botActive, botCallId, clock, update]);

  /* ---------------------------------- tab ---------------------------------- */

  const upload = useCallback(
    async (result: TabRecorderResult) => {
      lastBlob.current = result;
      const callId = sessionRef.current?.callId ?? (await callIdReady.current);
      if (!callId) {
        update({
          phase: 'failed',
          error: 'The recording could not be linked to a call.',
        });
        return;
      }
      update({ phase: 'uploading', uploadPct: 0, error: null });
      try {
        await uploadToCall({
          callId,
          file: result.blob,
          ext: 'webm',
          durationSec: Math.round(result.durationMs / 1000),
          mediaKind: result.hasVideo ? 'video' : 'audio',
          onProgress: (pct) => update({ uploadPct: pct }),
        });
        lastBlob.current = null;
        update({ phase: 'done', uploadPct: 100 });
      } catch (e) {
        update({
          phase: 'failed',
          error: e instanceof Error ? e.message : 'Upload failed.',
        });
      }
    },
    [update],
  );

  const startTab = useCallback(
    async ({ captureVideo, title }: { captureVideo: boolean; title?: string }) => {
      setHighlights([]);
      setScratchText('');
      setScratchState('idle');
      const name = title?.trim() || 'Tab recording';
      replace({
        kind: 'tab',
        callId: null,
        title: name,
        platformLabel: 'This browser tab',
        phase: 'starting',
        startedAt: null,
        uploadPct: 0,
        error: null,
      });
      const ok = await recorder.start(captureVideo, {
        onGesture: openOverlay,
        onStarted: (startedAt) => {
          update({ phase: 'recording', startedAt });
          callIdReady.current = createCall({
            source: 'tab',
            platform: 'browser',
            title: name,
          })
            .then(async (id) => {
              update({ callId: id });
              await fetch(`/api/calls/${id}/started`, { method: 'POST' });
              return id;
            })
            .catch(() => {
              update({
                error: 'Could not create the call. The recording continues.',
              });
              return null;
            });
        },
        onStopped: (result) => void upload(result),
      });
      if (!ok) {
        replace(null);
        closeOverlay();
      }
      return ok;
    },
    [recorder, openOverlay, update, upload, replace, closeOverlay],
  );

  const retryUpload = useCallback(async () => {
    if (lastBlob.current) await upload(lastBlob.current);
  }, [upload]);

  /* ---------------------------------- end ---------------------------------- */

  const end = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    update({ phase: 'ending' });
    if (s.kind === 'tab') {
      recorder.stop(); // onStopped uploads
      return;
    }
    if (!s.callId) return;
    const res = await fetch(`/api/calls/${s.callId}/notetaker`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 409) {
      update({
        phase: 'recording',
        error: 'Could not remove the notetaker. Try again.',
      });
    }
  }, [recorder, update]);

  const dismiss = useCallback(() => {
    closeOverlay();
    botMic?.getTracks().forEach((t) => t.stop());
    setBotMic(null);
    replace(null);
  }, [closeOverlay, botMic, replace]);

  /* ------------------------- highlights and scratchpad ------------------------ */

  const addHighlight = useCallback(async (tag: Tag) => {
    const s = sessionRef.current;
    if (!s?.callId || s.phase !== 'recording' || !s.startedAt) {
      return {
        ok: false,
        message: 'Highlights work once recording has started.',
      };
    }
    const offsetMs = Date.now() - s.startedAt;
    const res = await fetch(`/api/calls/${s.callId}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: tag.id,
        offsetMs: s.kind === 'tab' ? offsetMs : undefined,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      startMs?: number;
      message?: string;
    };
    if (!res.ok || !json.id)
      return {
        ok: false,
        message: json.message ?? 'Could not save the highlight.',
      };
    setHighlights((h) => [
      {
        id: json.id!,
        tagName: tag.name,
        color: tag.color,
        startMs: json.startMs ?? offsetMs,
      },
      ...h,
    ]);
    return { ok: true, message: '' };
  }, []);

  const setScratchpad = useCallback((text: string) => {
    setScratchText(text);
    setScratchState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const id = sessionRef.current?.callId;
      if (!id) {
        setScratchState('error');
        return;
      }
      const res = await fetch(`/api/calls/${id}/scratchpad`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).catch(() => null);
      setScratchState(res?.ok ? 'saved' : 'error');
    }, 800);
  }, []);

  // The bot path has no local recorder, so the mic meter asks for the mic on click.
  const enableMic = useCallback(async () => {
    try {
      setBotMic(await navigator.mediaDevices.getUserMedia({ audio: true }));
    } catch {
      // Permission denied: the meter stays off.
    }
  }, []);

  // Closing the app tab would lose a tab recording, so warn first.
  const recording = session?.kind === 'tab' && ['recording', 'ending', 'uploading'].includes(session.phase);
  useEffect(() => {
    if (!recording) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [recording]);

  // Closing the app tab also closes the PiP window with it.
  useEffect(() => () => pipWindow?.close(), [pipWindow]);

  const value = useMemo<Ctx>(
    () => ({
      session,
      tags,
      highlights,
      scratchpad,
      scratchState,
      micStream: session?.kind === 'tab' ? recorder.micStream : botMic,
      pipSupported,
      pipWindow,
      dockedOpen,
      pipRefused,
      clock,
      openOverlay,
      closeOverlay,
      startTab,
      beginBot,
      attachBot,
      failBot,
      end,
      retryUpload,
      dismiss,
      addHighlight,
      setScratchpad,
      enableMic,
      recorderError: recorder.error,
    }),
    [
      session,
      tags,
      highlights,
      scratchpad,
      scratchState,
      recorder.micStream,
      recorder.error,
      botMic,
      pipSupported,
      pipWindow,
      dockedOpen,
      pipRefused,
      clock,
      openOverlay,
      closeOverlay,
      startTab,
      beginBot,
      attachBot,
      failBot,
      end,
      retryUpload,
      dismiss,
      addHighlight,
      setScratchpad,
      enableMic,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

const PLATFORM: Record<string, string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  browser: 'This browser tab',
};

interface DocumentPiP {
  requestWindow(opts: { width: number; height: number }): Promise<Window>;
}
