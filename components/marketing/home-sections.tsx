'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductFrame, type FrameKind } from '@/components/marketing/product-frame';

/** Clarity / Momentum / Ease: clickable word tabs driving a product frame. */
const STEPS: { word: string; tag: string; body: string; frame: FrameKind }[] = [
  {
    word: 'Clarity',
    tag: 'Find anything anyone said',
    body: 'Search every transcript at once and jump straight to the moment it was said.',
    frame: 'summary',
  },
  {
    word: 'Momentum',
    tag: 'Know who is doing what',
    body: 'Each action item comes with an owner and a timestamp you can click to hear it again.',
    frame: 'ask',
  },
  {
    word: 'Ease',
    tag: 'Works in the browser',
    body: 'Send a notetaker, record a browser tab, or upload a file. You get the same notes either way.',
    frame: 'capture',
  },
];

export function ClarityMomentumEase() {
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <div className="flex flex-col gap-2" role="tablist">
          {STEPS.map((s, i) => (
            <button
              key={s.word}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                'text-left font-display text-5xl font-semibold tracking-tight transition-colors duration-200 sm:text-6xl',
                i === active ? 'text-off-white' : 'text-surface-3 hover:text-text-3',
              )}
            >
              {s.word}
            </button>
          ))}
        </div>
        <p className="micro-label mt-8 !text-lime">{STEPS[active].tag}</p>
        <p className="mt-3 max-w-md text-lg text-text-2">{STEPS[active].body}</p>
      </div>
      <ProductFrame kind={STEPS[active].frame} />
    </div>
  );
}

/** Feature carousel: arrows + dots, crossfade by key. */
const SLIDES: { caption: string; frame: FrameKind }[] = [
  { caption: 'Send the notetaker, or record the tab yourself if you would rather not have a bot in the call.', frame: 'capture' },
  { caption: 'A summary, the decisions and the action items, usually within a minute of hanging up.', frame: 'summary' },
  { caption: 'Ask a question about any of your meetings and get an answer with timestamps.', frame: 'ask' },
];

export function FeatureCarousel() {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div>
        <p className="micro-label mb-4">
          {String(i + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </p>
        <p className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {SLIDES[i].caption}
        </p>
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => go(i - 1)}
            className="flex size-10 items-center justify-center rounded-full border border-border-strong text-off-white transition-colors hover:border-lime hover:text-lime"
            aria-label="Previous"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            onClick={() => go(i + 1)}
            className="flex size-10 items-center justify-center rounded-full border border-border-strong text-off-white transition-colors hover:border-lime hover:text-lime"
            aria-label="Next"
          >
            <ArrowRight className="size-4" />
          </button>
          <div className="ml-3 flex gap-2">
            {SLIDES.map((_, n) => (
              <button
                key={n}
                onClick={() => setI(n)}
                className={cn('h-1 rounded-full transition-all duration-300', n === i ? 'w-6 bg-lime' : 'w-2 bg-surface-3')}
                aria-label={`Slide ${n + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div key={i} className="page-in">
        <ProductFrame kind={SLIDES[i].frame} />
      </div>
    </div>
  );
}
