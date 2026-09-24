import { PageHeading } from '@/components/ui/page-heading';

export const metadata = { title: 'Deals' };

const SAMPLE = [
  { deal: 'Acme — Platform', company: 'Acme', stage: 'Proposal', amount: '$48,000', calls: 6, close: 'Nov 24, 2026' },
  { deal: 'Globex Rollout', company: 'Globex', stage: 'Negotiation', amount: '$120,000', calls: 9, close: 'Oct 29, 2026' },
  { deal: 'Northwind Pilot', company: 'Northwind', stage: 'Discovery', amount: '$18,500', calls: 3, close: 'Oct 22, 2026' },
];

export default function DealsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Discover"
        title="Deals"
        description="Deal intelligence ties every sales call to the opportunity it moves forward."
        actions={
          <span className="rounded-pill border border-border-strong px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-text-3">
            Business plan · Coming soon
          </span>
        }
      />

      <div className="mb-3 flex items-center justify-between">
        <p className="micro-label">Sample data</p>
        <p className="text-xs text-text-3">Illustrative only — not connected to a CRM</p>
      </div>

      <div className="overflow-x-auto border-t border-border scroll-styled">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-text-3">
            <tr className="border-b border-border">
              {['Deal', 'Company', 'Stage', 'Amount', 'Calls', 'Close date'].map((h) => (
                <th key={h} className="py-3 pr-4 text-xs font-semibold uppercase tracking-[0.1em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((d) => (
              <tr key={d.deal} className="border-b border-border transition-colors hover:bg-white/[0.02]">
                <td className="py-4 pr-4 font-semibold text-off-white">{d.deal}</td>
                <td className="py-4 pr-4 text-text-2">{d.company}</td>
                <td className="py-4 pr-4 text-text-2">{d.stage}</td>
                <td className="py-4 pr-4 tnum">{d.amount}</td>
                <td className="py-4 pr-4 tnum text-text-2">{d.calls}</td>
                <td className="py-4 pr-4 tnum text-text-2">{d.close}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
