'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pill } from '@/components/ui/button';
import { useTypewriter } from '@/components/marketing/use-typewriter';
import { BRAND_NAME } from '@/lib/config';

/** Full-viewport hero (design §21-26): Carbon, Epic Pro display, typewriter
 *  sub-line, CTAs that fade in early, lime "AI READY" indicator. */
export function Hero() {
  const { out, done } = useTypewriter('finally understood.', { speed: 55, startDelay: 500 });
  const [ctaIn, setCtaIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCtaIn(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-20">
      <div className="mx-auto w-full max-w-[1200px]">
        <p className="micro-label mb-6 text-muted-dark blur-[1.5px]">Meeting intelligence, reimagined</p>

        <h1 className="font-display text-6xl font-semibold leading-[0.98] tracking-tight sm:text-8xl">
          Your meetings,
          <br />
          <span className="text-lime">
            {out || ' '}
            {!done && <span className="caret ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[2px] bg-lime align-middle" />}
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-lg text-muted">
          Capture every conversation. {BRAND_NAME} turns it into summaries, action items and a
          searchable, askable record — so you can focus on the room, not the notes.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center gap-4 transition-all duration-[400ms] ease-out"
          style={{ opacity: ctaIn ? 1 : 0, transform: ctaIn ? 'translateY(0)' : 'translateY(8px)' }}
        >
          <Link href="/signup">
            <Pill>Start a meeting →</Pill>
          </Link>
          <Link href="/overview">
            <Pill variant="outline">Explore the workspace</Pill>
          </Link>
          <span className="ml-2 flex items-center gap-2 text-sm text-muted">
            <span className="rec-dot size-2 rounded-full bg-lime" /> AI ready
          </span>
        </div>
      </div>
    </section>
  );
}
