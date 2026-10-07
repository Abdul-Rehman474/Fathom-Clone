import Link from 'next/link';
import { BrandMark } from '@/components/brand';
import { Pill } from '@/components/ui/button';
import { FOOTER_COLUMNS } from '@/lib/marketing';

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-bg-app">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="flex flex-col justify-between gap-8 lg:flex-row">
          <div>
            <BrandMark href="/" />
            <p className="mt-3 max-w-xs text-sm text-text-3">
              AI notetaking that captures, transcribes and summarizes your meetings.
            </p>
          </div>
          <Link href="/signup">
            <Pill className="h-11 px-8 text-sm">Try Fathom today</Pill>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-text-2 hover:text-text-1">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border pt-6 text-sm text-text-3 sm:flex-row">
          <div className="flex flex-wrap gap-4">
            <Link href="/legal/terms" className="hover:text-text-1">Terms of Service</Link>
            <Link href="/legal/privacy" className="hover:text-text-1">Privacy Policy</Link>
            <Link href="/security" className="hover:text-text-1">Security &amp; Compliance</Link>
            <Link href="/status" className="hover:text-text-1">Status</Link>
          </div>
          <span>© {year} All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}
