import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pill } from '@/components/ui/button';
import { MSection, PageHero, CtaBlock } from '@/components/marketing/blocks';
import { Reveal } from '@/components/marketing/motion';
import { Astronaut, Sparkle } from '@/components/marketing/illustrations';
import { SOLUTIONS } from '@/lib/marketing';

export function generateStaticParams() {
  return Object.keys(SOLUTIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SOLUTIONS[slug];
  return { title: s ? s.headline : 'Solutions' };
}

const PANELS = ['bg-purple', 'bg-orange', 'bg-pink'];
const BORDERS = ['border-cyan', 'border-pink', 'border-yellow'];

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SOLUTIONS[slug];
  if (!s) notFound();

  return (
    <>
      <PageHero title={s.headline} intro={s.intro}>
        <Link href="/signup">
          <Pill>Get started — it’s free</Pill>
        </Link>
        <Link href="/help">
          <Pill variant="secondary">Talk to sales</Pill>
        </Link>
      </PageHero>

      <div className="mx-auto flex max-w-2xl justify-center px-6">
        <Astronaut className="size-28" />
      </div>

      <MSection>
        <h2 className="mb-10 text-center font-display text-3xl font-light">
          Why {s.audience} teams choose Fathom
        </h2>
        <div className="space-y-6">
          {s.rows.map((row, i) => (
            <Reveal key={row.title} className={`grid gap-6 rounded-frame ${PANELS[i % PANELS.length]} p-8 lg:grid-cols-2 lg:items-center`}>
              <div>
                <h3 className="font-display text-2xl font-light text-white">{row.title}</h3>
                <p className="mt-2 text-white/80">{row.body}</p>
              </div>
              <div className="flex aspect-video items-center justify-center rounded-card bg-black/20 text-white/60">Product frame</div>
            </Reveal>
          ))}
        </div>
      </MSection>

      <MSection>
        <h2 className="mb-10 text-center font-display text-3xl font-light">
          Built for the {s.audience} lifecycle
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {s.lifecycle.map((c, i) => (
            <div key={c.title} className={`rounded-frame border ${BORDERS[i % BORDERS.length]} bg-surface-1 p-6`}>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="text-sm text-text-3">{c.subtitle}</p>
              <ul className="mt-4 space-y-2 text-sm text-text-2">
                {c.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <Sparkle className="mt-4 size-4 text-cyan" />
            </div>
          ))}
        </div>
      </MSection>

      <MSection>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <h2 className="font-display text-3xl font-light">Powering {s.audience} teams at scale</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {s.features.map((f) => (
              <div key={f.title} className="rounded-card border border-border bg-surface-1 p-5">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-text-2">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </MSection>

      <CtaBlock title={`Turn ${s.audience} conversations into momentum`} />
    </>
  );
}
