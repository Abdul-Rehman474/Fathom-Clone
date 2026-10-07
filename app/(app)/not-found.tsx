import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Not-found inside the signed-in shell (e.g. a deleted or unknown call). */
export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-xl py-24">
      <p className="micro-label mb-4">Not found</p>
      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        This isn’t on the record.
      </h1>
      <p className="mt-4 text-text-2">
        The call or page may have been deleted, or you may not have access to it.
      </p>
      <div className="mt-8">
        <Link href="/calls">
          <Button>Back to My Calls</Button>
        </Link>
      </div>
    </div>
  );
}
