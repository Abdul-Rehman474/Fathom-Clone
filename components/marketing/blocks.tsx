import Link from 'next/link';
import { Pill } from '@/components/ui/button';
import { Reveal } from '@/components/marketing/motion';

export function MSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-[1200px] px-6 py-16 md:py-24 ${className}`}>{children}</section>;
}

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <MSection className="!pt-20 text-center">
      <Reveal>
        {eyebrow && <p className="micro-label mb-4 !text-lime">{eyebrow}</p>}
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold tracking-tight leading-tight tracking-tight sm:text-6xl">
          {title}
        </h1>
        {intro && <p className="mx-auto mt-6 max-w-2xl text-lg text-text-2">{intro}</p>}
        {children && <div className="mt-8 flex flex-wrap justify-center gap-4">{children}</div>}
      </Reveal>
    </MSection>
  );
}

export function CtaBlock({ title }: { title: string }) {
  return (
    <MSection>
      <div className="rounded-frame border border-border bg-carbon-soft px-8 py-16 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-white">{title}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/help">
            <Pill>Talk to sales</Pill>
          </Link>
          <Link href="/pricing">
            <Pill variant="secondary">View pricing</Pill>
          </Link>
        </div>
      </div>
    </MSection>
  );
}
