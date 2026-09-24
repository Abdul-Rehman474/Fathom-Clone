'use client';

import { useCallback, useRef, useState } from 'react';

/** Tab capture hook (architecture.md §3.2): display + mic mixed via Web Audio,
 *  audio-only by default, chunked MediaRecorder, stop-sharing handling. */
export type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'error';

export interface TabRecorderResult {
  blob: Blob;
  durationMs: number;
  mimeType: string;
  hasVideo: boolean;
}

export function isTabCaptureSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
}

export function useTabRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const resolveRef = useRef<((r: TabRecorderResult) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setMicStream(null);
  }, []);

  const stop = useCallback((): Promise<TabRecorderResult> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState('stopping');
      recorderRef.current?.stop();
    });
  }, []);

  const start = useCallback(
    async (
      captureVideo: boolean,
      opts: {
        onGesture?: () => void;
        onStarted?: (startedAt: number) => void;
        /** Fires however recording ends: End, or the browser's "Stop sharing". */
        onStopped?: (result: TabRecorderResult) => void;
      } = {},
    ): Promise<boolean> => {
      setError(null);
      setState('requesting');
      try {
        const pending = navigator.mediaDevices.getDisplayMedia({
          video: captureVideo ? { frameRate: 15, width: 1280 } : true,
          audio: true,
        });
        // Still inside the click: anything else that needs the user gesture
        // (the overlay's Picture-in-Picture window) must run now.
        opts.onGesture?.();
        const display = await pending;
        if (display.getAudioTracks().length === 0) {
          display.getTracks().forEach((t) => t.stop());
          setState('error');
          setError('No tab audio was shared. Re-share the tab and tick “Share tab audio”.');
          return false;
        }
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamsRef.current = [display, mic];
        setMicStream(mic);

        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const dest = ctx.createMediaStreamDestination();
        ctx.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(dest);
        ctx.createMediaStreamSource(mic).connect(dest);

        const tracks = [
          ...dest.stream.getAudioTracks(),
          ...(captureVideo ? display.getVideoTracks() : []),
        ];
        const mimeType = captureVideo ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus';
        const recorder = new MediaRecorder(new MediaStream(tracks), {
          mimeType,
          videoBitsPerSecond: 350_000,
          audioBitsPerSecond: 48_000,
        });
        recorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const durationMs = Date.now() - startRef.current;
          cleanup();
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setState('idle');
          setElapsedMs(0);
          const result = { blob, durationMs, mimeType, hasVideo: captureVideo };
          resolveRef.current?.(result);
          resolveRef.current = null;
          opts.onStopped?.(result);
        };

        // If the user clicks the browser's "Stop sharing", finish like End.
        display.getVideoTracks().forEach((t) => {
          t.onended = () => stop();
        });
        display.getAudioTracks().forEach((t) => {
          t.onended = () => stop();
        });

        startRef.current = Date.now();
        recorder.start(5000);
        setState('recording');
        opts.onStarted?.(startRef.current);
        tickRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 250);
        return true;
      } catch (e) {
        cleanup();
        setState('error');
        const cancelled = e instanceof DOMException && e.name === 'NotAllowedError';
        setError(cancelled ? 'Sharing was cancelled.' : e instanceof Error ? e.message : 'Could not start recording');
        return false;
      }
    },
    [cleanup, stop],
  );

  return { state, error, elapsedMs, micStream, start, stop };
}
