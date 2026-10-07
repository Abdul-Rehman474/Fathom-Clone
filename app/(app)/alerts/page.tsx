import { PageHeading } from '@/components/ui/page-heading';

export const metadata = { title: 'Alerts' };

const EXAMPLES = [
  ['“pricing”', 'Every time a customer raises price in a call'],
  ['“competitor”', 'Mentions of named competitors across the team'],
  ['“cancel”', 'Early churn signals, linked to the exact moment'],
];

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="Discover"
        title="Keyword alerts"
        description="Get notified when a keyword comes up in any call, with a link straight to the moment it was said."
        actions={
          <span className="rounded-pill border border-border-strong px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-text-3">
            Coming soon
          </span>
        }
      />

      <p className="micro-label mb-3">What you’ll be able to track</p>
      <div className="border-t border-border">
        {EXAMPLES.map(([kw, desc]) => (
          <div key={kw} className="flex flex-col gap-1 border-b border-border py-5 sm:flex-row sm:items-center sm:gap-8">
            <span className="w-40 shrink-0 font-display text-lg font-semibold">{kw}</span>
            <span className="text-text-2">{desc}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-text-3">
        Alerts aren’t available in this build yet. Search already finds any phrase across your transcripts.
      </p>
    </div>
  );
}
