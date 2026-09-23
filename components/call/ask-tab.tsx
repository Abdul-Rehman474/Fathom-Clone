'use client';

import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHIPS = ['What were the decisions?', 'List action items by person', 'What objections came up?'];

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

/** Per-call Ask Fathom chat; [m:ss] citations become seek buttons. */
export function AskTab({ callId, onSeek }: { callId: string; onSeek: (ms: number) => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: question }, { role: 'assistant', text: '' }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/calls/${callId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok || !res.body) {
        setMessages((m) => setLast(m, 'Sorry, that failed.'));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => setLast(m, acc));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => ask(c)}
              className="rounded-pill border border-border px-3 py-1.5 text-sm text-text-2 hover:border-cyan hover:text-text-1"
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'rounded-card px-3 py-2 text-sm',
                m.role === 'user' ? 'bg-surface-2 text-text-1' : 'bg-surface-1 text-text-2',
              )}
            >
              {m.role === 'assistant' ? <Cited text={m.text} onSeek={onSeek} /> : m.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(input)}
          placeholder="Ask about this call…"
          className="flex-1 rounded-btn border border-border bg-surface-2 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus-visible:border-cyan"
        />
        <button
          onClick={() => ask(input)}
          disabled={busy || !input.trim()}
          className="flex size-9 items-center justify-center rounded-full bg-cyan text-black disabled:opacity-40"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Render text, converting [m:ss] into seek buttons. */
function Cited({ text, onSeek }: { text: string; onSeek: (ms: number) => void }) {
  if (!text) return <span className="text-text-3">…</span>;
  const parts = text.split(/(\[\d+:\d{2}\])/g);
  return (
    <span>
      {parts.map((p, i) => {
        const m = p.match(/^\[(\d+):(\d{2})\]$/);
        if (m) {
          const ms = (Number(m[1]) * 60 + Number(m[2])) * 1000;
          return (
            <button key={i} onClick={() => onSeek(ms)} className="font-mono text-cyan hover:underline tnum">
              {p}
            </button>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

function setLast(messages: Msg[], text: string): Msg[] {
  const copy = [...messages];
  for (let i = copy.length - 1; i >= 0; i--) {
    if (copy[i].role === 'assistant') {
      copy[i] = { ...copy[i], text };
      break;
    }
  }
  return copy;
}
