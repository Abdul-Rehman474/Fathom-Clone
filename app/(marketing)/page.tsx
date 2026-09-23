import Link from 'next/link';
import { Pill } from '@/components/ui/button';
import { Reveal, RevealItem, Marquee, CountUp } from '@/components/marketing/motion';
import { Planet, Moon, Rocket, Astronaut, Sparkle } from '@/components/marketing/illustrations';
import { ClarityMomentumEase, FeatureCarousel } from '@/components/marketing/home-sections';
import { LOGO_WALL } from '@/lib/marketing';
import { BRAND_NAME } from '@/lib/config';

const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`mx-auto max-w-[1200px] px-6 py-20 md:py-[120px] ${className}`}>{children}</section>
);

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <Section className="!py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal stagger>
            <RevealItem>
              <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
                AI notetaking that is <span className="text-orange">out of this world</span>
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="mt-6 max-w-lg text-lg text-text-2">
                {BRAND_NAME} summarizes your meetings so you can focus on the conversation.{' '}
                <span className="font-semibold text-text-1">Now available bot-free.</span>
              </p>
            </RevealItem>
            <RevealItem>
              <Link href="/signup" className="mt-8 inline-block">
                <Pill>Get started — free forever</Pill>
              </Link>
            </RevealItem>
            <RevealItem>
              <p className="mt-4 text-xs uppercase tracking-wide text-text-3">
                🔒 SOC 2 Type II · GDPR · HIPAA Compliant · SSO / SCIM (sample)
              </p>
            </RevealItem>
          </Reveal>

          <div className="relative flex justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-frame border border-cyan/50 bg-surface-1 p-4 text-sm text-text-2">
                Capture mode
                <div className="mt-2 space-y-1 text-text-3">
                  <div>Audio &amp; video</div>
                  <div>Audio only</div>
                  <div>Transcript only</div>
                </div>
              </div>
              <div className="rounded-frame border border-orange/50 bg-surface-1 p-4">
                <span className="text-sm font-semibold text-cyan">✧ Ask Fathom</span>
                <Astronaut className="mt-2 size-20" />
              </div>
              <div className="rounded-frame border border-purple/50 bg-surface-1 p-4 text-sm text-text-2">
                “What follow-ups did I commit to this week?”
              </div>
              <div className="flex items-center justify-center rounded-frame border border-border bg-surface-1 p-4">
                <Moon className="size-24" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 2. Proof row */}
      <Section className="!py-12">
        <Reveal className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-2">
            <span className="flex items-center gap-1 text-gold">
              <Sparkle className="size-4" /> 5.0/5.0 · #1 rated (sample)
            </span>
            <span>
              Used at <CountUp to={300000} suffix="+" className="font-semibold text-text-1" /> companies
            </span>
          </div>
          <Marquee className="w-full">
            {LOGO_WALL.map((name) => (
              <div key={name} className="flex h-16 w-40 items-center justify-center rounded-card border border-border bg-surface-1 text-text-3">
                {name}
              </div>
            ))}
          </Marquee>
          <span className="sr-only">Trusted by {LOGO_WALL.join(', ')} and more.</span>
        </Reveal>
      </Section>

      {/* 3. Feature carousel */}
      <Section>
        <Reveal>
          <FeatureCarousel />
        </Reveal>
      </Section>

      {/* 4. Marquee statement */}
      <Section className="!py-16">
        <Marquee seconds={40}>
          <span className="flex items-center gap-4 font-display text-5xl font-light text-text-1">
            Move work forward faster <Rocket className="size-16" />
          </span>
        </Marquee>
        <p className="sr-only">Move work forward faster.</p>
      </Section>

      {/* 5. Teams vs individuals */}
      <Section>
        <Reveal className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
          <Planet className="size-40" />
          <div>
            <h2 className="font-display text-4xl font-light">
              Whether you’re a team of 1 or 1,000, {BRAND_NAME}’s got your back
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {['Instant AI summaries', 'Speaker-labelled transcripts', 'Ask across every call', 'Shareable highlight playlists'].map((f) => (
                <div key={f} className="rounded-card border border-border bg-surface-1 p-4 text-sm text-text-2">
                  ✦ {f}
                </div>
              ))}
            </div>
            <Link href="/pricing" className="mt-6 inline-block">
              <Pill variant="secondary" className="h-11 px-6 text-sm">See our pricing</Pill>
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* 6. Clarity / Momentum / Ease */}
      <Section>
        <Reveal>
          <ClarityMomentumEase />
        </Reveal>
      </Section>

      {/* 7. CTA block */}
      <Section>
        <div className="rounded-frame bg-purple px-8 py-16 text-center">
          <h2 className="font-display text-4xl font-light text-white">Ready to never take notes again?</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/help">
              <Pill>Talk to sales</Pill>
            </Link>
            <Link href="/pricing">
              <Pill variant="secondary">View pricing</Pill>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
