import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/lib/config';

/** Recreated wordmark: a 3-bar cyan mark + brand text (designPlan.md §8). */
export function BrandMark({
  className,
  href = '/',
  showMenu = false,
}: {
  className?: string;
  href?: string | null;
  showMenu?: boolean;
}) {
  const inner = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-6 items-end gap-[3px]" aria-hidden>
        <span className="h-2.5 w-[3px] rounded-full bg-cyan" />
        <span className="h-5 w-[3px] rounded-full bg-cyan" />
        <span className="h-3.5 w-[3px] rounded-full bg-cyan" />
      </span>
      <span className="font-sans text-base font-bold tracking-wide text-text-1">{BRAND_NAME}</span>
      {showMenu && <span className="text-text-3">≡</span>}
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label={`${BRAND_NAME} home`}>
      {inner}
    </Link>
  );
}
