'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Video,
  Users,
  ListVideo,
  Search,
  Plug,
  Settings as SettingsIcon,
  Bell,
  BarChart3,
} from 'lucide-react';
import { BrandMark } from '@/components/brand';
import { ReferPopover } from '@/components/app/refer-popover';
import { HelpWidget } from '@/components/app/help-widget';
import { cn } from '@/lib/utils';

interface Item {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'My Calls', href: '/calls', icon: Video },
      { label: 'Team Calls', href: '/team', icon: Users },
      { label: 'Playlists', href: '/playlists', icon: ListVideo },
    ],
  },
  {
    title: 'Discover',
    items: [
      { label: 'Search', href: '/calls?focus=search', icon: Search },
      { label: 'Alerts', href: '/alerts', icon: Bell },
      { label: 'Deals', href: '/deals', icon: BarChart3 },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Integrations', href: '/settings#integrations', icon: Plug },
      { label: 'Settings', href: '/settings', icon: SettingsIcon },
    ],
  },
];

export function Sidebar({ inviteCode, onNavigate }: { inviteCode: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const isSearchView = params.get('focus') === 'search';

  function isActive(href: string): boolean {
    const base = href.split('?')[0].split('#')[0];
    if (base !== pathname) return false;
    if (base === '/calls') return href.includes('focus=search') ? isSearchView : !isSearchView;
    return true;
  }

  return (
    <div className="flex h-full flex-col gap-8 px-4 py-5">
      <div className="px-2">
        <BrandMark href="/calls" />
      </div>

      <nav className="flex flex-1 flex-col gap-7 overflow-y-auto scroll-styled">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="micro-label mb-2 px-2">{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-btn px-2.5 py-2 text-sm transition-colors',
                      active ? 'bg-lime/8 text-off-white' : 'text-muted hover:bg-white/5 hover:text-off-white',
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-lime" />}
                    <Icon className={cn('size-4 shrink-0', active ? 'text-lime' : 'text-muted-dark group-hover:text-muted')} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div>
        <p className="micro-label mb-2 px-2">Support</p>
        <div className="flex flex-col gap-0.5 px-2.5 text-sm text-muted [&_button]:text-muted [&_button:hover]:text-off-white">
          <HelpWidget />
          <ReferPopover inviteCode={inviteCode} />
        </div>
      </div>
    </div>
  );
}
