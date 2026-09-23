import { MSection } from '@/components/marketing/blocks';
import { WHATS_NEW } from '@/lib/marketing';
import { formatDate } from '@/lib/time';

export const metadata = { title: "What's New" };

export default function WhatsNewPage() {
  return (
    <MSection className="!pt-20">
      <h1 className="font-display text-4xl font-light sm:text-6xl">What’s new</h1>
      <div className="mt-10 space-y-4">
        {WHATS_NEW.map((item) => (
          <article key={item.title} className="rounded-card border border-border bg-surface-1 p-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-3 tnum">{formatDate(item.date)}</span>
              <span className="rounded-chip bg-cyan-tint px-2 py-0.5 text-xs font-semibold text-cyan">{item.tag}</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
            <p className="mt-1 text-text-2">{item.body}</p>
          </article>
        ))}
      </div>
    </MSection>
  );
}
