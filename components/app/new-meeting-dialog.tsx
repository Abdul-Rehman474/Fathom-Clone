'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Video, Bot, Link2, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { MAX_UPLOAD_BYTES, ACCEPTED_UPLOAD_EXT } from '@/lib/config';
import { uploadRecording, readMediaDuration } from '@/lib/capture-client';
import { useTabRecorder, isTabCaptureSupported } from '@/components/capture/use-tab-recorder';
import { msToClock } from '@/lib/time';

export function NewMeetingDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <p className="micro-label">Start a new meeting</p>
          <DialogTitle className="font-display text-2xl tracking-tight">How do you want to capture it?</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="record">
          <TabsList>
            <TabsTrigger value="create">Create meeting</TabsTrigger>
            <TabsTrigger value="notetaker">Join with notetaker</TabsTrigger>
            <TabsTrigger value="record">Record or upload</TabsTrigger>
          </TabsList>
          <div className="pt-5">
            <TabsContent value="create">
              <CreateMeetingPanel />
            </TabsContent>
            <TabsContent value="notetaker">
              <NotetakerPanel />
            </TabsContent>
            <TabsContent value="record">
              <RecordUploadPanel onDone={() => setOpen(false)} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Create meeting (Google Meet / Zoom) -------- */
function CreateMeetingPanel() {
  const [platform, setPlatform] = useState<'google' | 'zoom'>('google');
  const [title, setTitle] = useState('');
  const [autoNote, setAutoNote] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; callId: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: platform, title, sendNotetaker: autoNote }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === 'not_connected') {
          toast.error(`Connect ${platform === 'google' ? 'Google Meet' : 'Zoom'} in Settings first.`);
        } else {
          toast.error(json.message ?? 'Could not create the meeting');
        }
        return;
      }
      setResult({ url: json.meetingUrl, callId: json.callId });
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold">Your meeting is ready 🎉</p>
        <div className="flex gap-2">
          <Input readOnly value={result.url} />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(result.url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div className="flex gap-2">
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full">Join meeting ↗</Button>
          </a>
        </div>
        <p className="flex items-center gap-2 text-sm text-text-3">
          <Bot className="size-4" />{' '}
          {autoNote ? 'The notetaker will join when the bot connector is enabled.' : 'Notetaker not sent.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex gap-2">
        {(['google', 'zoom'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={cn(
              'flex-1 rounded-btn border px-3 py-2 text-sm',
              platform === p ? 'border-cyan text-cyan' : 'border-border text-text-2',
            )}
          >
            {p === 'google' ? 'Google Meet' : 'Zoom'}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-text-2">
        <input type="checkbox" checked={autoNote} onChange={(e) => setAutoNote(e.target.checked)} /> Send notetaker
        automatically
      </label>
      <Button className="w-full" onClick={create} disabled={busy}>
        <Link2 /> {busy ? 'Creating…' : 'Create & open'}
      </Button>
    </div>
  );
}

/* -------- Join with notetaker (Recall seam — Prompt 4) -------- */
function NotetakerPanel() {
  const [url, setUrl] = useState('');
  const valid = /https?:\/\/(meet\.google\.com|.*zoom\.us|teams\.(microsoft|live)\.com)/i.test(url);
  return (
    <div className="space-y-4">
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a Meet, Zoom or Teams link" />
      {url && !valid && <p className="text-xs text-danger">That doesn’t look like a supported meeting link.</p>}
      <div className="flex items-start gap-2 rounded-btn border border-border bg-surface-2 p-3 text-sm text-text-3">
        <AlertTriangle className="mt-0.5 size-4 text-warning" />
        The notetaker bot is set up in a later step. The link is validated here so the flow is ready.
      </div>
      <Button className="w-full" disabled={!valid}>
        <Bot /> Send Notetaker
      </Button>
    </div>
  );
}

/* -------- Record or upload (fully functional) -------- */
function RecordUploadPanel({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [captureVideo, setCaptureVideo] = useState(false);
  const recorder = useTabRecorder();
  const supported = isTabCaptureSupported();

  async function onFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED_UPLOAD_EXT.includes(ext as (typeof ACCEPTED_UPLOAD_EXT)[number])) {
      toast.error(`Unsupported file type. Use ${ACCEPTED_UPLOAD_EXT.join(', ')}.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('File is over the 50 MB limit for this plan.');
      return;
    }
    try {
      setProgress(5);
      const { durationSec, isVideo } = await readMediaDuration(file);
      const callId = await uploadRecording({
        file,
        ext,
        durationSec,
        mediaKind: isVideo ? 'video' : 'audio',
        source: 'upload',
        platform: 'upload',
        title: file.name.replace(/\.[^.]+$/, ''),
        onProgress: setProgress,
      });
      toast.success('Uploaded — processing started');
      onDone();
      router.push(`/calls/${callId}`);
    } catch (e) {
      setProgress(null);
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    }
  }

  async function startRecording() {
    await recorder.start(captureVideo);
  }
  async function stopRecording() {
    try {
      const result = await recorder.stop();
      setProgress(5);
      const callId = await uploadRecording({
        file: result.blob,
        ext: 'webm',
        durationSec: Math.round(result.durationMs / 1000),
        mediaKind: result.hasVideo ? 'video' : 'audio',
        source: 'tab',
        platform: 'browser',
        title: 'Tab recording',
        onProgress: setProgress,
      });
      toast.success('Recording saved — processing started');
      onDone();
      router.push(`/calls/${callId}`);
    } catch (e) {
      setProgress(null);
      toast.error(e instanceof Error ? e.message : 'Could not save recording');
    }
  }

  if (progress !== null) {
    return (
      <div className="space-y-3 py-6 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-cyan" />
        <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-pill bg-surface-2">
          <div className="h-full bg-cyan transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-text-2">{progress < 100 ? 'Uploading…' : 'Processing…'}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Record this tab */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <Video className="size-4 text-cyan" /> Record this tab
        </div>
        {!supported ? (
          <p className="text-sm text-text-3">Tab capture needs Chrome or Edge.</p>
        ) : recorder.state === 'recording' || recorder.state === 'stopping' ? (
          <>
            <p className="font-mono text-sm text-danger tnum">● Recording {msToClock(recorder.elapsedMs)}</p>
            <Button variant="danger" onClick={stopRecording} disabled={recorder.state === 'stopping'}>
              End &amp; process
            </Button>
          </>
        ) : (
          <>
            <div role="radiogroup" aria-label="Capture mode" className="space-y-1.5">
              {[
                { v: false, label: 'Audio only', hint: 'Recommended' },
                { v: true, label: 'Audio + video', hint: 'Larger file' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={captureVideo === o.v}
                  onClick={() => setCaptureVideo(o.v)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-btn border px-3 py-2 text-left text-sm transition-colors',
                    captureVideo === o.v ? 'border-lime/60 text-off-white' : 'border-border text-text-2 hover:border-border-strong',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex size-3.5 items-center justify-center rounded-full border',
                        captureVideo === o.v ? 'border-lime' : 'border-border-strong',
                      )}
                    >
                      {captureVideo === o.v && <span className="size-1.5 rounded-full bg-lime" />}
                    </span>
                    {o.label}
                  </span>
                  <span className="text-xs text-text-3">{o.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-3">Remember to collect attendee consent before recording.</p>
            <Button onClick={startRecording}>Start recording</Button>
          </>
        )}
        {recorder.error && <p className="text-xs text-danger">{recorder.error}</p>}
      </div>

      {/* Upload */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <Upload className="size-4 text-cyan" /> Upload recording
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-1 flex-col items-center justify-center gap-2 rounded-btn border border-dashed border-border-strong py-6 text-sm text-text-3 hover:border-cyan hover:text-text-2"
        >
          <Upload className="size-6" />
          Drag &amp; drop or click
          <span className="text-xs">MP3 · WAV · M4A · WEBM · MP4 · ≤ 50 MB</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.wav,.m4a,.webm,.mp4,audio/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    </div>
  );
}
