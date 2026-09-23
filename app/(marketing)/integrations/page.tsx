'use client';

import { useState } from 'react';
import Link from 'next/link';
import { INTEGRATIONS } from '@/lib/marketing';
import { MSection } from '@/components/marketing/blocks';

const CATEGORIES = ['All', 'Meeting platforms', 'AI', 'CRM', 'Productivity', 'Developer'] as const;

export default function IntegrationsPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');
  const shown = cat === 'All' ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === cat);
  return (
    <>
      <MSection className="!pt-20 text-center">
        <h1 className="font-display text-4xl font-light sm:text-6xl">Integrations</h1>
        <p className="mx-auto mt-4 max-w-xl text-text-2">Connect Fathom to the tools your team already uses.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-pill border px-4 py-1.5 text-sm ${
                cat === c ? 'border-cyan text-cyan' : 'border-border text-text-2 hover:text-text-1'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </MSection>

      <MSection className="!pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((i) => (
            <Link
              key={i.slug}
              href={`/integrations/${i.slug}`}
              className="rounded-card border border-border bg-surface-1 p-5 hover:bg-surface-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-btn bg-white font-bold text-black">
                  {i.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-xs text-text-3">{i.category}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-text-2">{i.blurb}</p>
              <p className={`mt-3 text-xs font-semibold ${i.available ? 'text-success' : 'text-gold'}`}>
                {i.available ? 'Available' : 'Coming soon in this demo'}
              </p>
            </Link>
          ))}
        </div>
      </MSection>
    </>
  );
}
