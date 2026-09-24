import { MSection } from '@/components/marketing/blocks';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <MSection className="!pt-20">
      <article className="prose-invert mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-3">Sample terms for a demo application.</p>
        <div className="mt-8 space-y-6 text-text-2">
          {[
            ['1. Acceptance', 'By using this demo you agree these terms are illustrative and the product is a portfolio clone, not a commercial service.'],
            ['2. Use of the service', 'Record only meetings you are authorized to record, and collect attendee consent where required by law.'],
            ['3. Content', 'You retain rights to your recordings and transcripts. You are responsible for the content you upload.'],
            ['4. Availability', 'The service is provided “as is” without warranties. Features may change or be removed.'],
            ['5. Contact', 'For questions about this demo, use the in-app Help & Feedback widget.'],
          ].map(([h, b]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-text-1">{h}</h2>
              <p className="mt-1">{b}</p>
            </section>
          ))}
        </div>
      </article>
    </MSection>
  );
}
