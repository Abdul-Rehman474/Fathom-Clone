import { cn } from '@/lib/utils';

/** Static skeleton block — no shimmer gradient (designPlan.md §1, UI.md §0). */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-btn bg-surface-1', className)} {...props} />;
}
