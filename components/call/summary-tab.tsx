'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, RefreshCw } from 'lucide-react';
import type { SummaryContent } from '@/lib/types';
import { TimestampChip } from '@/components/ui/chips';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toaster';
import { SUMMARY_TEMPLATES, TEMPLATE_LABELS } from '@/lib/config';
import { msToClock } from '@/lib/time';

export function SummaryTab({
  callId,
  content,
  template,
  onSeek,
}: {
  callId: string;
  content: SummaryContent;
  template: string;
  onSeek: (ms: number) => void;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<'topic' | 'chronological'>('topic');
  const [busy, setBusy] = useState(false);

  const chronological = useMemo(() => {
    const items: { text: string; start_ms: number | null }[] = [];
    content.topics.forEach((t) => t.bullets.forEach((b) => items.push(b)));
    content.decisions.forEach((d) => items.push(d));
    return items.filter((i) => i.start_ms != null).sort((a, b) => (a.start_ms ?? 0) - (b.start_ms ?? 0));
  }, [content]);

  async function regenerate(newTemplate: string) {
    setBusy(true);
    const res = await fetch(`/api/calls/${callId}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: newTemplate }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success('Regenerating summary…');
      setTimeout(() => router.refresh(), 3500);
    } else toast.error('Could not regenerate');
  }

  function copyMarkdown() {
    const md = toMarkdown(content);
    navigator.clipboard.writeText(md).then(
      () => toast.success('Summary copied'),
      () => toast.error('Copy failed'),
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={template} onValueChange={regenerate}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue>{TEMPLATE_LABELS[template as keyof typeof TEMPLATE_LABELS] ?? 'General'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUMMARY_TEMPLATES.map((t) => (
              <SelectItem key={t} value={t}>
                {TEMPLATE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={(v) => setOrder(v as 'topic' | 'chronological')}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue>{order === 'topic' ? 'By topic' : 'Chronological'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="topic">By topic</SelectItem>
            <SelectItem value="chronological">Chronological</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={copyMarkdown}>
            <Copy /> Copy
          </Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => regenerate(template)}>
            <RefreshCw className={busy ? 'animate-spin' : ''} /> Regenerate
          </Button>
        </div>
      </div>

      {order === 'chronological' ? (
        <Section title="Chronological">
          {chronological.map((b, i) => (
            <Bullet key={i} text={b.text} ms={b.start_ms} onSeek={onSeek} />
          ))}
        </Section>
      ) : (
        <>
          {content.overview && (
            <p className="font-display text-xl leading-relaxed tracking-tight text-off-white">{content.overview}</p>
          )}
          {content.purpose && (
            <Section title="Meeting purpose" list={false}>
              <p className="leading-relaxed text-off-white/90">{content.purpose}</p>
            </Section>
          )}
          {content.key_takeaways.length > 0 && (
            <Section title="Key takeaways">
              {content.key_takeaways.map((t, i) => (
                <li key={i} className="leading-relaxed text-off-white/90">
                  {t}
                </li>
              ))}
            </Section>
          )}
          {content.topics.map((t, i) => (
            <Section key={i} title={t.title}>
              {t.bullets.map((b, j) => (
                <Bullet key={j} text={b.text} ms={b.start_ms} onSeek={onSeek} />
              ))}
            </Section>
          ))}
          {content.decisions.length > 0 && (
            <Section title="Decisions">
              {content.decisions.map((d, i) => (
                <Bullet key={i} text={d.text} ms={d.start_ms} onSeek={onSeek} />
              ))}
            </Section>
          )}
          {content.next_steps.length > 0 && (
            <Section title="Next steps">
              {content.next_steps.map((t, i) => (
                <li key={i} className="leading-relaxed text-off-white/90">
                  {t}
                </li>
              ))}
            </Section>
          )}
          {content.questions.length > 0 && (
            <Section title="Questions raised">
              {content.questions.map((t, i) => (
                <li key={i} className="leading-relaxed text-off-white/90">
                  {t}
                </li>
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children, list = true }: { title: string; children: React.ReactNode; list?: boolean }) {
  return (
    <div>
      <h3 className="micro-label mb-3">{title}</h3>
      {list ? <ul className="space-y-2">{children}</ul> : children}
    </div>
  );
}

function Bullet({ text, ms, onSeek }: { text: string; ms: number | null; onSeek: (ms: number) => void }) {
  return (
    <li className="flex items-start gap-3 leading-relaxed text-off-white/90">
      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-lime" />
      <span>
        {text} {ms != null && <TimestampChip ms={ms} onSeek={onSeek} />}
      </span>
    </li>
  );
}

function toMarkdown(c: SummaryContent): string {
  const lines: string[] = [`# ${c.title}`, '', c.overview, ''];
  if (c.purpose) lines.push(`**Purpose:** ${c.purpose}`, '');
  if (c.key_takeaways.length) {
    lines.push('## Key takeaways', ...c.key_takeaways.map((t) => `- ${t}`), '');
  }
  c.topics.forEach((t) => {
    lines.push(`## ${t.title}`, ...t.bullets.map((b) => `- ${b.text}${b.start_ms != null ? ` (${msToClock(b.start_ms)})` : ''}`), '');
  });
  if (c.decisions.length) lines.push('## Decisions', ...c.decisions.map((d) => `- ${d.text}`), '');
  if (c.action_items.length)
    lines.push('## Action items', ...c.action_items.map((a) => `- ${a.text}${a.assignee ? ` (${a.assignee})` : ''}`), '');
  if (c.next_steps.length) lines.push('## Next steps', ...c.next_steps.map((t) => `- ${t}`), '');
  if (c.questions.length) lines.push('## Questions', ...c.questions.map((t) => `- ${t}`), '');
  return lines.join('\n');
}
