import { ShieldCheck } from 'lucide-react';
import { MSection, PageHero } from '@/components/marketing/blocks';

export const metadata = { title: 'Security & Compliance' };

const ITEMS = [
  ['Row-level security', 'Every table enforces per-user access; two accounts can never see each other’s private calls.'],
  ['Encrypted secrets', 'OAuth tokens are encrypted at rest; the service-role key never reaches the browser.'],
  ['Signed media URLs', 'Recordings live in private storage and are served only through short-lived signed URLs.'],
  ['Verified webhooks', 'Provider callbacks are secret-checked and de-duplicated.'],
  ['Unguessable share links', '128-bit share tokens that can be revoked at any time.'],
  ['Prompt-injection hygiene', 'Transcripts are wrapped as data so embedded instructions are ignored.'],
];

export default function SecurityPage() {
  return (
    <>
      <PageHero eyebrow="Security" title="Built for trust" intro="Sample compliance posture. The security controls below are implemented in this build." />
      <MSection className="!pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {ITEMS.map(([h, b]) => (
            <div key={h} className="flex gap-3 rounded-card border border-border bg-surface-1 p-5">
              <ShieldCheck className="size-5 shrink-0 text-success" />
              <div>
                <h3 className="font-semibold">{h}</h3>
                <p className="mt-1 text-sm text-text-2">{b}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-text-3">SOC 2 · GDPR · HIPAA badges shown on this demo are sample content.</p>
      </MSection>
    </>
  );
}
