'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Pill } from '@/components/ui/button';
import { MSection } from '@/components/marketing/blocks';
import { PRICING } from '@/lib/marketing';
import { cn } from '@/lib/utils';

const FAQ = [
  { q: 'Is there a free plan?', a: 'Yes. Free includes unlimited recordings, AI summaries and Ask Fathom.' },
  { q: 'Can I change plans later?', a: 'Anytime. Upgrades and downgrades take effect immediately.' },
  { q: 'Do you offer team pricing?', a: 'Team and Business plans include shared workspaces and admin controls.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <MSection className="!pt-20 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">Simple, honest pricing</h1>
        <div className="mt-8 inline-flex rounded-pill border border-border p-1">
          {(['Monthly', 'Annual'] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => setAnnual(i === 1)}
              className={cn(
                'rounded-pill px-5 py-1.5 text-sm',
                annual === (i === 1) ? 'bg-cyan text-black' : 'text-text-2',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </MSection>

      <MSection className="!pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col rounded-frame border bg-surface-1 p-6',
                plan.popular ? 'border-cyan' : 'border-border',
              )}
            >
              {plan.popular && (
                <span className="mb-2 w-fit rounded-chip bg-yellow px-2 py-0.5 text-xs font-semibold text-black">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-text-3">{plan.tagline}</p>
              <div className="mt-4 font-display text-4xl tnum">
                ${annual ? plan.price.annual : plan.price.monthly}
                <span className="text-base text-text-3">/mo</span>
              </div>
              <Link href="/signup" className="mt-4">
                <Pill variant={plan.popular ? 'primary' : 'outline'} className="h-11 w-full px-4 text-sm">
                  Get started
                </Pill>
              </Link>
              <ul className="mt-6 space-y-2 text-sm text-text-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-cyan" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </MSection>

      <MSection className="!pt-0">
        <h2 className="mb-6 text-center font-display text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
        <div className="mx-auto max-w-2xl space-y-2">
          {FAQ.map((f, i) => (
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
        </div>
      </MSection>
    </>
  );
}
