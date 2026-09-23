'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Settings, Star } from 'lucide-react';
import { BrandMark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { NewMeetingDialog } from '@/components/app/new-meeting-dialog';
import { ReferPopover } from '@/components/app/refer-popover';
import { HelpWidget } from '@/components/app/help-widget';
import { AvatarMenu } from '@/components/app/avatar-menu';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';

export function TopBar({
  name,
  email,
  inviteCode,
  credits,
}: {
  name: string;
  email: string;
  inviteCode: string;
  credits: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/calls?q=${encodeURIComponent(q.trim())}` : '/calls');
  }

  return (
    <TooltipProvider delayDuration={200}>
      <header className="flex h-16 items-center gap-4 border-b border-border bg-bg-app px-8">
        <BrandMark href="/calls" showMenu />
        <form onSubmit={submitSearch} className="relative ml-2 w-[400px] max-w-[40vw]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Call Recordings"
            className="h-10 w-full rounded-btn border border-border bg-surface-2 pl-9 pr-3 text-sm text-text-1 placeholder:text-text-3 focus-visible:border-cyan"
          />
        </form>

        <div className="ml-auto flex items-center gap-5">
          <NewMeetingDialog>
            <Button size="sm">
              <Plus /> New Meeting
            </Button>
          </NewMeetingDialog>
          <ReferPopover inviteCode={inviteCode} />
          <Link href="/settings" className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1">
            <Settings className="size-4" /> Settings
          </Link>
          <HelpWidget />
          <SimpleTooltip content="Credits earned from referrals">
            <span className="flex items-center gap-1 text-sm font-semibold text-gold tnum">
              <Star className="size-4 fill-gold" /> {credits}
            </span>
          </SimpleTooltip>
          <AvatarMenu name={name} email={email} />
        </div>
      </header>
    </TooltipProvider>
  );
}
