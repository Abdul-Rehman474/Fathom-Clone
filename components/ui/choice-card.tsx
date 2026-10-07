'use client';

import { cn } from '@/lib/utils';

/** Choice card (designPlan.md §6): 320×200, surface-1, selected = cyan border. */
export function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  children,
  className,
}: {
  selected?: boolean;
  onSelect?: () => void;
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col gap-3 rounded-frame border bg-surface-1 p-5 text-left transition-colors hover:bg-surface-2',
        selected ? 'border-[1.5px] border-cyan' : 'border-border',
        className,
      )}
    >
      {icon && <div className="text-cyan [&_svg]:size-6">{icon}</div>}
      <div className="text-base font-semibold text-text-1">{title}</div>
      {children && <div className="text-sm text-text-2">{children}</div>}
    </button>
  );
}
