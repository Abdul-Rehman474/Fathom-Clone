import { Button } from '@/components/ui/button';

export const metadata = { title: 'Deals' };

const SAMPLE = [
  { deal: 'Acme — Platform', company: 'Acme', stage: 'Proposal', amount: '$48,000', calls: 6, close: 'Nov 24, 2026' },
  { deal: 'Globex Rollout', company: 'Globex', stage: 'Negotiation', amount: '$120,000', calls: 9, close: 'Oct 29, 2026' },
  { deal: 'Northwind Pilot', company: 'Northwind', stage: 'Discovery', amount: '$18,500', calls: 3, close: 'Oct 22, 2026' },
];

export default function DealsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-card border border-border bg-surface-1 p-6">
        <h1 className="text-lg font-semibold">Deal intelligence is available on Business</h1>
        <p className="mt-1 text-sm text-text-2">Track deals, calls and outcomes in one place.</p>
        <Button className="mt-4" variant="outline">
          Start trial
        </Button>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">Sample data</p>
      <div className="overflow-hidden rounded-card border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-text-3">
            <tr>
              <th className="p-3 font-medium">Deal</th>
              <th className="p-3 font-medium">Company</th>
              <th className="p-3 font-medium">Stage</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Calls</th>
              <th className="p-3 font-medium">Close date</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((d) => (
              <tr key={d.deal} className="border-t border-border">
                <td className="p-3">{d.deal}</td>
                <td className="p-3 text-text-2">{d.company}</td>
                <td className="p-3 text-text-2">{d.stage}</td>
                <td className="p-3 tnum">{d.amount}</td>
                <td className="p-3 tnum">{d.calls}</td>
                <td className="p-3 text-text-2 tnum">{d.close}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
