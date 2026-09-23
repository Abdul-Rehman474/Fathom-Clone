'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { MSection } from '@/components/marketing/blocks';
import { FAQ } from '@/lib/faq';

export default function HelpPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const shown = q ? FAQ.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase())) : FAQ;

  return (
    <MSection className="!pt-20">
      <div className="text-center">
        <h1 className="font-display text-4xl font-light sm:text-6xl">Help Center</h1>
        <div className="relative mx-auto mt-8 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search help articles"
            className="h-11 w-full rounded-btn border border-border bg-surface-2 pl-9 pr-3 text-sm focus-visible:border-cyan"
          />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-2">
        {shown.map((f, i) => (
          <div key={f.q} className="rounded-card border border-border bg-surface-1">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-left font-medium"
            >
              {f.q}
              <span className="text-text-3">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-text-2">{f.a}</p>}
          </div>
        ))}
        {shown.length === 0 && <p className="text-center text-text-3">No articles match “{q}”.</p>}
      </div>
    </MSection>
  );
}
