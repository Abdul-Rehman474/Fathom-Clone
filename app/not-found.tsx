import Link from 'next/link';
import { BrandMark } from '@/components/brand';
import { Pill } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-black px-6 py-8">
      <BrandMark />
      <main className="page-in flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-[1200px]">
          <p className="micro-label mb-4">Error 404</p>
          <h1 className="font-display text-5xl font-semibold leading-[1] tracking-tight sm:text-7xl">
            This page
            <br />
            <span className="text-lime">isn’t on the record.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-text-2">
            The link may be broken or the page may have moved.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/">
              <Pill>Back to home</Pill>
            </Link>
            <Link href="/calls">
              <Pill variant="secondary">Open My Calls</Pill>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
