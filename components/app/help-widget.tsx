'use client';

import { useState } from 'react';
import { LifeBuoy, X, Bot, Mail, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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

      <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={`${BRAND_NAME} help`}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 top-16 z-40 flex h-[min(560px,calc(100dvh-5rem))] w-[min(380px,calc(100vw-2rem))] origin-top-right flex-col overflow-hidden rounded-frame border border-border-strong bg-surface-1 text-off-white"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">{BRAND_NAME} help</div>
              <div className="text-xs text-text-3">Usually answered within a day</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close help" className="text-text-3 hover:text-off-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scroll-styled">
            {view === 'home' && (
              <div className="space-y-3">
                <p className="text-sm text-text-2">What do you need?</p>
                <QuickReply icon={<Bot className="size-4" />} label="Ask the help bot" onClick={() => setView('ai')} />
                <QuickReply icon={<Mail className="size-4" />} label="Open a ticket (reply within a day)" onClick={() => setView('ticket')} />
                <QuickReply icon={<MessageSquare className="size-4" />} label="Share feedback" onClick={() => setView('feedback')} />
              </div>
            )}
            {view === 'ai' && <AskAi onBack={() => setView('home')} />}
            {view === 'ticket' && <FeedbackForm kind="ticket" onDone={() => setView('home')} />}
            {view === 'feedback' && <FeedbackForm kind="feedback" onDone={() => setView('home')} />}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}

function QuickReply({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-btn border border-border px-3 py-2.5 text-left text-sm text-text-2 transition-colors hover:border-lime/50 hover:text-off-white"
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
      setA('That didn’t go through. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-text-3 hover:text-off-white">
        <ArrowLeft className="size-3" /> Back
      </button>
      {a && <p className="border-l-2 border-lime pl-3 text-sm leading-relaxed text-off-white/90">{a}</p>}
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask a question…"
         
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
      toast.success(kind === 'ticket' ? 'Ticket sent. We’ll reply by email.' : 'Feedback sent. Thank you.');
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
         
        />
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your message"
       
      />
      <Button onClick={submit} disabled={busy} className="w-full">
        Submit
      </Button>
    </div>
  );
}
