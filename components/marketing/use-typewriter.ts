'use client';

import { useEffect, useState } from 'react';

/** Character-by-character reveal (design §24). Respects reduced motion by
 *  showing the full text immediately. */
export function useTypewriter(text: string, opts?: { speed?: number; startDelay?: number }) {
  const speed = opts?.speed ?? 55;
  const startDelay = opts?.startDelay ?? 300;
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      // One-time sync from an external preference (prefers-reduced-motion).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOut(text);
      setDone(true);
      return;
    }

    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { out, done };
}
