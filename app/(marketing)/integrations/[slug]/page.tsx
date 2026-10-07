import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pill } from '@/components/ui/button';
import { MSection, PageHero, CtaBlock } from '@/components/marketing/blocks';
import { INTEGRATIONS } from '@/lib/marketing';

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = INTEGRATIONS.find((x) => x.slug === slug);
  return { title: i ? `${i.name} integration` : 'Integration' };
}

export default async function IntegrationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const integration = INTEGRATIONS.find((i) => i.slug === slug);
  if (!integration) notFound();

  return (
    <>
      <PageHero
        eyebrow={integration.category}
        title={`${integration.name} + Fathom`}
        intro={integration.blurb}
      >
        <Link href="/signup">
          <Pill>{integration.available ? 'Get started' : 'Join the waitlist'}</Pill>
        </Link>
        <span className={`self-center text-sm font-semibold ${integration.available ? 'text-lime' : 'text-text-3'}`}>
          {integration.available ? 'Available' : 'Coming soon in this demo'}
        </span>
      </PageHero>

      <MSection>
        <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">What you can do</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {['Capture every call', 'Sync the summary', 'Act on what matters'].map((t, i) => (
            <div key={t} className="rounded-card border border-border bg-surface-1 p-6">
              <div className="mb-2 text-sm font-semibold text-cyan">0{i + 1}</div>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-text-2">
                Bring {integration.name} together with Fathom’s notes and action items.
              </p>
            </div>
          ))}
        </div>
      </MSection>

      <MSection>
        <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="mx-auto max-w-xl space-y-4">
          {['Connect your account', 'Record or upload a meeting', 'See it flow into ' + integration.name].map((s, i) => (
            <li key={s} className="flex gap-4 rounded-card border border-border bg-surface-1 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan font-bold text-black">
                {i + 1}
              </span>
              <span className="self-center text-text-2">{s}</span>
            </li>
          ))}
        </ol>
      </MSection>

      <CtaBlock title={`Bring ${integration.name} and Fathom together`} />
    </>
  );
}
