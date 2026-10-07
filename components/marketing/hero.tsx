'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Pill } from '@/components/ui/button';
import { useTypewriter } from '@/components/marketing/use-typewriter';
import { BRAND_NAME } from '@/lib/config';

/** Full-viewport hero (design §21-26): Carbon, Familjen Grotesk display, typewriter
 *  sub-line, CTAs that fade in early, lime "AI READY" indicator. */
export function Hero() {
  const { out, done } = useTypewriter('written up for you.', { speed: 55, startDelay: 500 });
  const [ctaIn, setCtaIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCtaIn(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-20">
      <div className="mx-auto w-full max-w-[1200px]">
        <motion.p
          className="micro-label mb-6 text-muted"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Notes for Google Meet, Zoom and Teams
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Your meetings,
          <br />
          <span className="text-lime">
            {out || ' '}
            {!done && <span className="caret ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[2px] bg-lime align-middle" />}
          </span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-xl text-lg text-muted"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          {BRAND_NAME} joins the call, records it, and sends you a transcript, a summary and
          the action items with who owns them. You talk. It takes the notes.
        </motion.p>

        <div
          className="mt-10 flex flex-wrap items-center gap-4 transition-all duration-[400ms] ease-out"
          style={{ opacity: ctaIn ? 1 : 0, transform: ctaIn ? 'translateY(0)' : 'translateY(8px)' }}
        >
          <Link href="/signup">
            <Pill>Try it free</Pill>
          </Link>
          <Link href="/overview">
            <Pill variant="outline">See how it works</Pill>
          </Link>
          <span className="ml-2 flex items-center gap-2 text-sm text-muted">
            <span className="rec-dot size-2 rounded-full bg-lime" /> Free while in beta
          </span>
        </div>
      </div>
    </section>
  );
}
