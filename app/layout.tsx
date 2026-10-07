import type { Metadata } from 'next';
import { Familjen_Grotesk, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { BRAND_NAME } from '@/lib/config';
import './globals.css';
import { MotionProvider } from '@/components/ui/motion';

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME}: meeting notes that write themselves`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    'An AI notetaker that captures your meetings, transcribes them with speaker labels, and turns them into summaries, action items and a searchable, askable history.',
};

const display = Familjen_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display-face' });
const body = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body-face' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono-face' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
