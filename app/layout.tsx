import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — Meetings, understood`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    'An AI notetaker that captures your meetings, transcribes them with speaker labels, and turns them into summaries, action items and a searchable, askable history.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
