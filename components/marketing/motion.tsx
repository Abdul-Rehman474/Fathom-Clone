'use client';

import { useEffect, useRef, useState } from 'react';
import * as motion from 'motion/react-client';
import { useReducedMotion, useInView, animate } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Section reveal (designPlan.md §7.2): fade + 16px rise, once, staggered
 * children, disabled under prefers-reduced-motion. Marketing pages only.
 */
export function Reveal({
  children,
  className,
  stagger = false,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        show: { transition: stagger ? { staggerChildren: 0.06 } : {} },
      }}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

/** A child of <Reveal stagger> that fades+rises. */
export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/**
 * Horizontal marquee (designPlan.md §7.2): CSS transform loop, pauses on
 * hover/focus, duplicated for seamlessness, aria-hidden. Static under reduced
 * motion (children simply wrap).
 */
export function Marquee({
  children,
  className,
  seconds = 40,
}: {
  children: React.ReactNode;
  className?: string;
  seconds?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn('flex flex-wrap gap-8', className)}>{children}</div>;
  }
  return (
    <div className={cn('group relative overflow-hidden', className)} aria-hidden>
      <div
        className="flex w-max gap-8 [animation:marquee_var(--dur)_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
        style={{ ['--dur' as string]: `${seconds}s` }}
      >
        <div className="flex shrink-0 gap-8">{children}</div>
        <div className="flex shrink-0 gap-8">{children}</div>
      </div>
    </div>
  );
}

/** Count-up when scrolled into view (designPlan.md §7.2). */
export function CountUp({ to, suffix = '', className }: { to: number; suffix?: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, to, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className={cn('tnum', className)}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}
