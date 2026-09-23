'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Clarity / Momentum / Ease — clickable word tabs with a product panel
 *  (designPlan.md §7.2 sticky feature section; here as click-driven tabs,
 *  which is the reduced-motion-safe equivalent). */
const STEPS = [
  { word: 'Clarity', tag: 'Unforgettable meetings…quite literally', body: 'Every call becomes a searchable, summarized record — so the details never slip away.' },
  { word: 'Momentum', tag: 'Action items that actually happen', body: 'Owners and timestamps are captured automatically, and follow-ups are one click away.' },
  { word: 'Ease', tag: 'Nothing to install', body: 'Runs fully in your browser. Send a bot, record a tab, or upload a file — same clean result.' },
];

export function ClarityMomentumEase() {
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div className="flex flex-col gap-4">
        {STEPS.map((s, i) => (
          <button
            key={s.word}
            onClick={() => setActive(i)}
            className={cn(
              'text-left font-display text-4xl font-light transition-colors sm:text-5xl',
              i === active ? 'text-text-1' : 'text-text-3 hover:text-text-2',
            )}
          >
            {s.word}
          </button>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-cyan">✦ {STEPS[active].tag}</p>
        <p className="mt-3 text-lg text-text-2">{STEPS[active].body}</p>
        <div className="mt-8 flex aspect-video items-center justify-center rounded-frame border border-border bg-surface-1">
          <div className="flex size-40 items-center justify-center rounded-full bg-cyan/20">
            <span className="font-display text-2xl text-cyan">{STEPS[active].word}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Home feature carousel (crossfade, arrows + dots; autoplay stops on interaction). */
const SLIDES = [
  { caption: 'Capture notes your way — bot or no bot — so you can stay focused on the meeting', label: 'Capture' },
  { caption: 'AI summaries instantly available after your call', label: 'Summary' },
];

export function FeatureCarousel() {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-2xl text-center font-display text-2xl font-light text-text-1">{SLIDES[i].caption}</p>
      <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-frame border border-border bg-surface-1">
        <span className="font-display text-3xl text-text-3">{SLIDES[i].label}</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => go(i - 1)} className="flex size-9 items-center justify-center rounded-full bg-yellow text-black" aria-label="Previous">←</button>
        <div className="flex gap-2">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              className={cn('size-2 rounded-full', n === i ? 'bg-cyan' : 'bg-surface-3')}
              aria-label={`Slide ${n + 1}`}
            />
          ))}
        </div>
        <button onClick={() => go(i + 1)} className="flex size-9 items-center justify-center rounded-full bg-yellow text-black" aria-label="Next">→</button>
      </div>
    </div>
  );
}
