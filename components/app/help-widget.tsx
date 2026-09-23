'use client';

import { useState } from 'react';
import { LifeBuoy, X, Bot, Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toaster';
import { submitFeedback } from '@/app/(app)/actions';
import { BRAND_NAME } from '@/lib/config';

type View = 'home' | 'ai' | 'ticket' | 'feedback';

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('home');

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1"
      >
        <LifeBuoy className="size-4" /> Help &amp; Feedback
      </button>

      {open && (
        <div className="fixed right-4 top-16 z-40 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-frame bg-white text-neutral-900 shadow-xl">
          <div className="flex items-center justify-between bg-neutral-900 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-semibold">{BRAND_NAME} Support</div>
              <div className="text-xs text-neutral-300">We’re here to help!</div>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scroll-styled">
            {view === 'home' && (
              <div className="space-y-3">
                <div className="rounded-card bg-neutral-100 p-3 text-sm">Hey there 👋 How can we help you today?</div>
                <QuickReply icon={<Bot className="size-4" />} label="Ask AI — instant" onClick={() => setView('ai')} />
                <QuickReply icon={<Mail className="size-4" />} label="Open a ticket — <1 biz day" onClick={() => setView('ticket')} />
                <QuickReply icon={<MessageSquare className="size-4" />} label="Share feedback" onClick={() => setView('feedback')} />
              </div>
            )}
            {view === 'ai' && <AskAi onBack={() => setView('home')} />}
            {view === 'ticket' && <FeedbackForm kind="ticket" onDone={() => setView('home')} />}
            {view === 'feedback' && <FeedbackForm kind="feedback" onDone={() => setView('home')} />}
          </div>
        </div>
      )}
    </>
  );
}

function QuickReply({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-card border border-neutral-200 px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
    >
      {icon} {label}
    </button>
  );
}

function AskAi({ onBack }: { onBack: () => void }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!q.trim()) return;
    setBusy(true);
    setA(null);
    try {
      const res = await fetch('/api/help/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      setA(json.answer ?? 'Sorry, I’m not sure.');
    } catch {
      setA('Something went wrong.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs text-neutral-500">
        ← Back
      </button>
      {a && <div className="rounded-card bg-neutral-100 p-3 text-sm">{a}</div>}
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask a question…"
          className="border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
        />
        <Button size="icon" onClick={send} disabled={busy}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function FeedbackForm({ kind, onDone }: { kind: 'ticket' | 'feedback'; onDone: () => void }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    const res = await submitFeedback({ kind, subject, body });
    setBusy(false);
    if (res.ok) {
      toast.success(kind === 'ticket' ? 'Ticket submitted' : 'Thanks for the feedback!');
      onDone();
    } else {
      toast.error(res.error ?? 'Could not submit');
    }
  }
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{kind === 'ticket' ? 'Open a ticket' : 'Share feedback'}</div>
      {kind === 'ticket' && (
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
        />
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your message"
        className="border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
      />
      <Button onClick={submit} disabled={busy} className="w-full">
        Submit
      </Button>
    </div>
  );
}
