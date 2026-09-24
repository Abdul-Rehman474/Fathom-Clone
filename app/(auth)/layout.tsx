import { BrandMark } from '@/components/brand';
import { Toaster } from '@/components/ui/toaster';
import { BRAND_NAME } from '@/lib/config';

/**
 * Dedicated authentication shell — a split screen, deliberately unlike the
 * marketing hero: form on the left, an editorial brand panel on the right.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-bg-app lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <BrandMark />
        <main className="page-in flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-text-3">© {new Date().getFullYear()} {BRAND_NAME}</p>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden border-l border-border bg-carbon-deep p-12 lg:flex">
        <p className="micro-label">Meeting intelligence</p>
        <blockquote>
          <p className="font-display text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
            “Work smarter, not harder,” they said.
          </p>
          <p className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-lime xl:text-5xl">
            {BRAND_NAME} took it personally.
          </p>
          <footer className="mt-8 text-sm text-text-3">Sample testimonial · Product team</footer>
        </blockquote>
        <div className="grid grid-cols-3 gap-6 border-t border-border pt-8">
          {[
            ['Summaries', 'in seconds'],
            ['Speakers', 'auto-labelled'],
            ['Every call', 'searchable'],
          ].map(([a, b]) => (
            <div key={a}>
              <p className="font-display text-lg font-semibold">{a}</p>
              <p className="text-sm text-text-3">{b}</p>
            </div>
          ))}
        </div>
      </aside>
      <Toaster />
    </div>
  );
}
