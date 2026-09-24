'use client';

import { MotionConfig, motion } from 'motion/react';

/** App-wide motion defaults: honour the OS "reduce motion" setting. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its child into place; `index` staggers items in a list. */
export function Rise({
  index = 0,
  children,
  className,
}: {
  index?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay: Math.min(index, 12) * 0.045 }}
    >
      {children}
    </motion.div>
  );
}
