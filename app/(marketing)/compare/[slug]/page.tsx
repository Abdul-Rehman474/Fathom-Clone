import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { MSection, PageHero, CtaBlock } from '@/components/marketing/blocks';
import { BRAND_NAME } from '@/lib/config';

function pretty(slug: string) {
  return slug
    .split('-')
    .map((w) => (w === 'ai' ? 'AI' : w[0]?.toUpperCase() + w.slice(1)))
    .join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${BRAND_NAME} vs. ${pretty(slug)}` };
}

const ROWS = [
  ['Bot-free tab recording', true, false],
  ['Speaker-labelled transcripts', true, true],
  ['AI summaries & action items', true, true],
  ['Ask across all your calls', true, false],
  ['Highlight playlists', true, false],
  ['Free forever plan', true, false],
];

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = pretty(slug);

  return (
    <>
      <PageHero eyebrow="Comparison" title={`${BRAND_NAME} vs. ${competitor}`} intro={`See how ${BRAND_NAME} compares. This table is illustrative sample content.`} />
      <MSection className="!pt-0">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-card border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="p-4 font-medium">Feature</th>
                <th className="p-4 text-center font-semibold text-cyan">{BRAND_NAME}</th>
                <th className="p-4 text-center font-medium text-text-3">{competitor}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, us, them]) => (
                <tr key={label as string} className="border-t border-border">
                  <td className="p-4">{label}</td>
                  <td className="p-4 text-center">{us ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-text-3" />}</td>
                  <td className="p-4 text-center">{them ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-text-3" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MSection>
      <CtaBlock title={`Switch to ${BRAND_NAME} today`} />
    </>
  );
}
