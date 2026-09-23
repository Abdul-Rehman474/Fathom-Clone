import { cn } from '@/lib/utils';
import type { CallStatus } from '@/lib/types';

/** Status badge (designPlan.md §6, UI.md §6). Colour is never the only signal. */
const CONFIG: Record<CallStatus, { label: string; className: string; dot?: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-surface-3 text-text-2' },
  joining: { label: 'Joining', className: 'bg-surface-3 text-text-2' },
  waiting_admit: { label: 'Waiting to be admitted', className: 'bg-warning/15 text-warning' },
  recording: { label: 'Recording', className: 'bg-danger/15 text-danger', dot: 'bg-danger' },
  uploading: { label: 'Uploading', className: 'bg-cyan/15 text-cyan' },
  transcribing: { label: 'Transcribing', className: 'bg-cyan/15 text-cyan' },
  summarizing: { label: 'Summarizing', className: 'bg-cyan/15 text-cyan' },
  ready: { label: 'Ready', className: 'bg-success/15 text-success' },
  failed: { label: 'Failed', className: 'bg-danger/15 text-danger' },
};

export function StatusBadge({ status, className }: { status: CallStatus; className?: string }) {
  const c = CONFIG[status];
  const animated = status === 'transcribing' || status === 'summarizing';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium',
        c.className,
        className,
      )}
    >
      {c.dot && (
        <span className={cn('size-1.5 rounded-full', c.dot, status === 'recording' && 'animate-pulse')} />
      )}
      {c.label}
      {animated && <span className="tnum">…</span>}
    </span>
  );
}
