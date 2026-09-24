'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { msToClock } from '@/lib/time';

/** Timestamp chip (designPlan.md §6): mono, cyan, click = seek. A real button. */
export function TimestampChip({
  ms,
  onSeek,
  className,
}: {
  ms: number;
  onSeek?: (ms: number) => void;
  className?: string;
}) {
  const clock = msToClock(ms);
  const total = Math.floor(ms / 1000);
  const label = `Jump to ${Math.floor(total / 60)} minutes ${total % 60} seconds`;
  return (
    <button
      type="button"
      onClick={() => onSeek?.(ms)}
      aria-label={label}
      className={cn(
        'inline-flex items-center font-mono text-xs text-cyan tnum hover:underline',
        className,
      )}
    >
      @ {clock}
    </button>
  );
}

/** Assignee chip: lime text on the dark lime tint, person icon. */
export function AssigneeChip({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-chip bg-cyan-tint px-1.5 py-0.5 text-xs text-lime',
        className,
      )}
    >
      <User className="size-3" />
      {name}
    </span>
  );
}

/** Tag pill (designPlan.md §6): colour square + uppercase name in the tag colour. */
export function TagPill({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide', className)} style={{ color }}>
      <span className="size-3 rounded-[3px]" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
