'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Star, Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/app/sidebar';
import { AvatarMenu } from '@/components/app/avatar-menu';
import { NewMeetingDialog } from '@/components/app/new-meeting-dialog';
import { Button } from '@/components/ui/button';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';
import { CaptureSessionProvider } from '@/components/capture/session';
import { OverlayHost, RecordingBar } from '@/components/capture/overlay';

export function AppShell({
  name,
  email,
  credits,
  inviteCode,
  children,
}: {
  name: string;
  email: string;
  credits: number;
  inviteCode: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [mobileNav, setMobileNav] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus search when arriving via the sidebar "Search" entry.
  useEffect(() => {
    if (params.get('focus') === 'search') searchRef.current?.focus();
  }, [params]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/calls?q=${encodeURIComponent(q.trim())}` : '/calls');
  }

  return (
    <TooltipProvider delayDuration={200}>
      <CaptureSessionProvider>
        <div className="flex min-h-screen bg-bg-app">
          {/* Desktop sidebar */}
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border lg:block">
            <Sidebar inviteCode={inviteCode} />
          </aside>

          {/* Mobile sidebar sheet */}
          {mobileNav && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNav(false)} />
              <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-bg-app">
                <button
                  onClick={() => setMobileNav(false)}
                  className="absolute right-3 top-4 text-text-3 hover:text-text-1"
                  aria-label="Close navigation"
                >
                  <X className="size-5" />
                </button>
                <Sidebar inviteCode={inviteCode} onNavigate={() => setMobileNav(false)} />
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg-app px-4 md:px-8">
              <button className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation">
                <Menu className="size-5" />
              </button>

              <form onSubmit={submitSearch} className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
                <input
                  ref={searchRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search meetings…"
                  className="h-10 w-full rounded-btn border border-border bg-surface-1 pl-9 pr-3 text-sm text-text-1 placeholder:text-text-3 focus-visible:border-lime/50"
                />
              </form>

              <div className="ml-auto flex items-center gap-3 md:gap-5">
                <NewMeetingDialog>
                  <Button size="sm" aria-label="New meeting">
                    <Plus /> <span className="hidden sm:inline">New Meeting</span>
                  </Button>
                </NewMeetingDialog>
                <SimpleTooltip content="Credits earned from referrals">
                  <span className="hidden items-center gap-1 text-sm font-semibold text-lime tnum sm:flex">
                    <Star className="size-4 fill-lime" /> {credits}
                  </span>
                </SimpleTooltip>
                <AvatarMenu name={name} email={email} />
              </div>
            </header>

            <RecordingBar />

            <main className="page-in flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
          </div>
        </div>
        <OverlayHost />
      </CaptureSessionProvider>
    </TooltipProvider>
  );
}
