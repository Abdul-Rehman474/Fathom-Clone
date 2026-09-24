import Link from 'next/link';
import { Pill } from '@/components/ui/button';
import { MSection, PageHero, CtaBlock } from '@/components/marketing/blocks';
import { Reveal, CountUp } from '@/components/marketing/motion';
import { Moon } from '@/components/marketing/illustrations';
import { ProductFrame } from '@/components/marketing/product-frame';
import { LOGO_WALL } from '@/lib/marketing';

export const metadata = { title: 'Overview' };

export default function OverviewPage() {
  return (
    <>
      <PageHero title="Meeting intelligence built around you" intro="Capture, understand and act on every conversation — without lifting a finger during the call.">
        <Link href="/signup">
          <Pill variant="secondary">Get started — it’s free</Pill>
        </Link>
      </PageHero>

      <div className="mx-auto -mt-8 flex max-w-2xl justify-center px-6">
        <Moon className="size-24" />
      </div>

      <MSection className="text-center">
        <p className="text-lg text-text-2">
          Used and loved by more than{' '}
          <CountUp to={300000} suffix="+" className="font-semibold text-text-1" /> companies worldwide
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {LOGO_WALL.map((n) => (
            <div key={n} className="flex h-14 w-36 items-center justify-center rounded-card border border-border bg-surface-1 text-text-3">
              {n}
            </div>
          ))}
        </div>
      </MSection>

      <MSection>
        <Reveal className="grid gap-8 rounded-frame border border-border bg-carbon-soft p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">Never miss what matters</h2>
            <p className="mt-3 text-white/80">
              Instant AI summaries in your favorite meeting platform — Zoom, Google Meet or Teams.
            </p>
          </div>
          <ProductFrame kind="summary" />
        </Reveal>
      </MSection>

      <CtaBlock title="See what your meetings have been telling you" />
    </>
  );
}
