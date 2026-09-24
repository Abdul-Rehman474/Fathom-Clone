import { cn } from '@/lib/utils';

/** Shared page heading for app screens: micro-label, display title, optional
 *  description and right-aligned actions, closed by a hairline divider. */
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'mb-10 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="micro-label mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-text-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

/** Typographic empty state — no illustrations, just hierarchy and an action. */
export function EmptyState({
  label,
  title,
  body,
  action,
  className,
}: {
  label: string;
  title?: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-20 text-center', className)}>
      <p className="micro-label mb-3">{label}</p>
      {title && <p className="font-display text-2xl font-semibold tracking-tight">{title}</p>}
      <p className="mx-auto mt-3 max-w-md text-text-2">{body}</p>
      {action && <div className="mt-8 flex justify-center">{action}</div>}
    </div>
  );
}
