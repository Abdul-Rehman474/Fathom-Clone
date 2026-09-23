'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/calls', label: 'My Calls' },
  { href: '/team', label: 'Team Calls' },
  { href: '/playlists', label: 'Playlists' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/deals', label: 'Deals' },
];

export function AppTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex h-14 items-center gap-6 border-b border-border px-8">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + '/');
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'relative flex h-full items-center text-[15px] font-medium transition-colors',
              active ? 'text-cyan' : 'text-text-2 hover:text-text-1',
            )}
          >
            {t.label}
            {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan" />}
          </Link>
        );
      })}
    </nav>
  );
}
