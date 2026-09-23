import type { Metadata } from 'next';
import { Sora, Inter, Barlow_Semi_Condensed, JetBrains_Mono } from 'next/font/google';
import { BRAND_NAME } from '@/lib/config';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-barlow',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — AI notetaking that is out of this world`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    'An AI notetaker that joins or captures your meetings, transcribes them with speaker labels, and turns them into summaries, action items and a searchable, askable history.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${barlow.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
