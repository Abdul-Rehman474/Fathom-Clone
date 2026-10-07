'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHIPS = ['Surprise me with an insight', 'Any looming deadlines?', 'Summarize my meetings from this week'];

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

export function AskPanel() {
  const [open, setOpen] = useState(true);
  const [scope, setScope] = useState<'mine' | 'team'>('mine');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ask-open');
      // Per-viewer preference sync from an external store (localStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved != null) setOpen(saved === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('ask-open', open ? '1' : '0');
    } catch {}
  }, [open]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: question }, { role: 'assistant', text: '' }]);
    setBusy(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, scope }),
      });
      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setMessages((m) => updateLast(m, json.message ?? 'That question did not go through. Try again.'));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => updateLast(m, acc));
      }
    } catch {
      setMessages((m) => updateLast(m, 'The answer was cut off. Check your connection and ask again.'));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-20 z-20 flex items-center gap-1.5 rounded-btn border border-border bg-surface-1 px-3 py-2 text-sm text-cyan hover:bg-surface-2"
      >
        <PanelRightOpen className="size-4" /> Ask
      </button>
    );
  }

  return (
    <aside className="hidden w-90 shrink-0 flex-col border-l border-border bg-bg-app lg:flex" style={{ width: 360 }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-off-white">
          <span className="rec-dot size-1.5 rounded-full bg-lime" /> Ask Fathom
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-text-3 hover:text-text-1"
          aria-label="Collapse Ask panel"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scroll-styled">
        {messages.length === 0 ? (
          <div className="space-y-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => ask(c)}
                className="block w-full rounded-pill border border-border px-3 py-1.5 text-right text-sm text-text-2 hover:border-cyan hover:text-text-1"
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === 'user' ? (
              <div
                key={i}
                className="ml-auto w-fit max-w-[90%] rounded-btn bg-surface-2 px-3 py-2 text-sm text-off-white"
              >
                {m.text}
              </div>
            ) : (
              <div key={i} className="border-l-2 border-lime pl-3">
                <p className="micro-label mb-1 !text-lime">Fathom AI</p>
                <p className="text-sm leading-relaxed text-off-white/90">
                  {m.text || <span className="text-text-3">Thinking…</span>}
                </p>
              </div>
            ),
          )
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(input)}
            placeholder="Ask anything…"
            className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus-visible:border-cyan"
          />
          <button
            onClick={() => ask(input)}
            disabled={busy || !input.trim()}
            className="flex size-9 items-center justify-center rounded-full bg-lime text-carbon transition-transform hover:-translate-y-px disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <div className="mt-2">
          <Select value={scope} onValueChange={(v) => setScope(v as 'mine' | 'team')}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue>{scope === 'mine' ? 'My Calls' : 'Team Calls'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My Calls</SelectItem>
              <SelectItem value="team">Team Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}

function updateLast(messages: Msg[], text: string): Msg[] {
  const copy = [...messages];
  for (let i = copy.length - 1; i >= 0; i--) {
    if (copy[i].role === 'assistant') {
      copy[i] = { ...copy[i], text };
      break;
    }
  }
  return copy;
}
