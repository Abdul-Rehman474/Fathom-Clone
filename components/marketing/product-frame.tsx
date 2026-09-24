import { cn } from '@/lib/utils';

/**
 * Static product mock-ups rendered in the design system (no screenshots, no
 * placeholder boxes). Illustrative sample content only.
 */
export type FrameKind = 'capture' | 'summary' | 'ask' | 'team';

function Chrome({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-border bg-carbon text-left', className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="ml-2 text-xs text-text-3">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Ts({ t }: { t: string }) {
  return <span className="font-mono text-xs text-lime tnum">{t}</span>;
}

export function ProductFrame({ kind, className }: { kind: FrameKind; className?: string }) {
  if (kind === 'capture') {
    return (
      <Chrome title="Product Strategy · Google Meet" className={className}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-lime">
            <span className="rec-dot size-2 rounded-full bg-lime" /> RECORDING
          </span>
          <span className="font-mono text-sm text-off-white tnum">00:32:18</span>
        </div>
        <p className="micro-label mt-6 mb-2">Capture mode</p>
        {['Audio + video', 'Audio only', 'Transcript only'].map((m, i) => (
          <div
            key={m}
            className={cn(
              'flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0',
              i === 1 ? 'text-off-white' : 'text-text-3',
            )}
          >
            {m}
            {i === 1 && <span className="size-1.5 rounded-full bg-lime" />}
          </div>
        ))}
        <div className="mt-5 flex gap-2">
          {['Highlight', 'Needs review', 'Feedback'].map((t) => (
            <span key={t} className="rounded-chip border border-border px-2 py-1 text-xs text-text-2">
              {t}
            </span>
          ))}
        </div>
      </Chrome>
    );
  }

  if (kind === 'summary') {
    return (
      <Chrome title="Summary · 48 min" className={className}>
        <p className="micro-label mb-2">Key moments</p>
        {[
          ['01:12', 'Launch target confirmed for October'],
          ['08:42', 'Budget approved for the beta'],
          ['13:41', 'Customer retention plan discussed'],
        ].map(([t, s]) => (
          <div key={t} className="flex items-baseline gap-3 border-b border-border py-2 text-sm last:border-0">
            <Ts t={t} />
            <span className="text-text-2">{s}</span>
          </div>
        ))}
        <p className="micro-label mt-5 mb-2">Action items</p>
        {[
          ['Abdul', 'Prepare launch checklist'],
          ['Sarah', 'Contact marketing'],
        ].map(([who, what]) => (
          <div key={who} className="flex items-center gap-3 py-1.5 text-sm">
            <span className="size-3.5 rounded-[3px] border border-border-strong" />
            <span className="text-off-white">{who}</span>
            <span className="text-text-3">— {what}</span>
          </div>
        ))}
      </Chrome>
    );
  }

  if (kind === 'ask') {
    return (
      <Chrome title="Ask Fathom" className={className}>
        <div className="ml-auto w-fit max-w-[85%] rounded-btn bg-surface-2 px-3 py-2 text-sm text-off-white">
          What did we decide about the launch date?
        </div>
        <div className="mt-4 border-l-2 border-lime pl-3">
          <p className="micro-label mb-1 !text-lime">Fathom AI</p>
          <p className="text-sm text-text-2">
            The team decided to target the first week of October, pending the security review.
          </p>
          <p className="mt-3 text-xs text-text-3">
            Sources <Ts t="13:42" /> <Ts t="21:07" />
          </p>
        </div>
      </Chrome>
    );
  }

  // team
  return (
    <Chrome title="Team Calls" className={className}>
      {[
        ['Intro call — Northwind', 'Anne Lee', '42 min'],
        ['Demo — Globex', 'Marcus Chen', '31 min'],
        ['QBR — Initech', 'Sara Ruiz', '58 min'],
        ['Renewal — Acme', 'Cooper Dor', '27 min'],
      ].map(([t, who, d]) => (
        <div key={t} className="flex items-center justify-between border-b border-border py-3 last:border-0">
          <div>
            <p className="text-sm font-semibold text-off-white">{t}</p>
            <p className="text-xs text-text-3">{who}</p>
          </div>
          <span className="text-xs text-text-3 tnum">{d}</span>
        </div>
      ))}
    </Chrome>
  );
}
