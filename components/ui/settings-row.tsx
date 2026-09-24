import { cn } from '@/lib/utils';

/** Settings row — editorial divider row (no floating card): icon, title +
 *  description, control on the right. */
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
        'flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-btn border border-border text-text-2 [&_svg]:size-4">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <div className="font-semibold text-off-white">{title}</div>
          {description && <div className="text-sm text-text-2">{description}</div>}
        </div>
      </div>
      {control && <div className="shrink-0 sm:pl-4">{control}</div>}
    </div>
  );
}
