import { MSection } from '@/components/marketing/blocks';

export const metadata = { title: 'System Status' };

const SYSTEMS = ['Web app', 'Recording', 'Transcription', 'AI summaries', 'Ask Fathom'];

export default function StatusPage() {
  return (
    <MSection className="!pt-20">
      <h1 className="font-display text-4xl font-light sm:text-6xl">System status</h1>
      <div className="mt-4 flex items-center gap-2 text-success">
        <span className="size-2.5 rounded-full bg-success" /> All systems operational
      </div>
      <div className="mt-8 space-y-2">
        {SYSTEMS.map((s) => (
          <div key={s} className="flex items-center justify-between rounded-card border border-border bg-surface-1 p-4">
            <span>{s}</span>
            <span className="flex items-center gap-2 text-sm text-success">
              <span className="size-2 rounded-full bg-success" /> Operational
            </span>
          </div>
        ))}
      </div>
    </MSection>
  );
}
