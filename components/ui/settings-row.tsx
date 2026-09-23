import { cn } from '@/lib/utils';

/** Settings row (designPlan.md §6): surface-1, radius 12, icon + title/desc + control. */
export function SettingsRow({
  icon,
  title,
  description,
  control,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  control?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-card border border-border bg-surface-1 p-6',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-btn bg-white text-black [&_svg]:size-5">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <div className="text-base font-semibold text-text-1">{title}</div>
          {description && <div className="text-sm text-text-2">{description}</div>}
        </div>
      </div>
      {control && <div className="shrink-0">{control}</div>}
    </div>
  );
}
