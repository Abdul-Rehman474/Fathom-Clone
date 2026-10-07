'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/brand';
import { Pill } from '@/components/ui/button';
import { NAV_MENUS } from '@/lib/marketing';
import { cn } from '@/lib/utils';

type MenuKey = keyof typeof NAV_MENUS;

export function MarketingHeader() {
  const [open, setOpen] = useState<MenuKey | null>(null);
  const [mobile, setMobile] = useState(false);
  const [stuck, setStuck] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function openMenu(k: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(k);
  }
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(null), 150);
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors',
        stuck ? 'border-border bg-bg-app' : 'border-transparent bg-bg-black',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <BrandMark />

        <nav className="hidden items-center gap-1 rounded-pill border border-border px-2 py-1 lg:flex">
          <Link href="/overview" className="rounded-pill px-3 py-1.5 text-sm text-text-2 hover:text-text-1">
            Overview
          </Link>
          {(Object.keys(NAV_MENUS) as MenuKey[]).map((key) => (
            <div key={key} className="relative" onMouseEnter={() => openMenu(key)} onMouseLeave={scheduleClose}>
              <button
                onClick={() => setOpen(open === key ? null : key)}
                className="flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm text-text-2 hover:text-text-1"
                aria-expanded={open === key}
              >
                {key} <ChevronDown className="size-3.5" />
              </button>
              {open === key && (
                <div
                  className="absolute left-0 top-full mt-2 w-60 rounded-2xl border border-border-strong bg-surface-2 p-2"
                  onMouseEnter={() => openMenu(key)}
                  onMouseLeave={scheduleClose}
                >
                  {NAV_MENUS[key].map((item) => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className="block rounded-btn px-3 py-2 text-sm text-text-2 hover:bg-surface-3 hover:text-text-1"
                      onClick={() => setOpen(null)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/pricing" className="rounded-pill px-3 py-1.5 text-sm text-text-2 hover:text-text-1">
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/help" className="text-sm text-text-2 hover:text-text-1">
            Book a Demo
          </Link>
          <Link href="/login" className="text-sm text-text-2 hover:text-text-1">
            Log In
          </Link>
          <Link href="/signup">
            <Pill className="h-10 px-5 text-xs">Sign up free</Pill>
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
          <Menu className="size-6" />
        </button>
      </div>

      {mobile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-black p-6 lg:hidden">
          <div className="flex items-center justify-between">
            <BrandMark />
            <button onClick={() => setMobile(false)} aria-label="Close menu">
              <X className="size-6" />
            </button>
          </div>
          <div className="mt-8 flex flex-col gap-4 overflow-y-auto">
            <Link href="/overview" onClick={() => setMobile(false)} className="text-lg">
              Overview
            </Link>
            {(Object.keys(NAV_MENUS) as MenuKey[]).map((key) => (
              <details key={key}>
                <summary className="cursor-pointer text-lg">{key}</summary>
                <div className="mt-2 flex flex-col gap-2 pl-4">
                  {NAV_MENUS[key].map((item) => (
                    <Link key={item.href + item.label} href={item.href} onClick={() => setMobile(false)} className="text-text-2">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <Link href="/pricing" onClick={() => setMobile(false)} className="text-lg">
              Pricing
            </Link>
            <Link href="/login" onClick={() => setMobile(false)} className="text-lg">
              Log In
            </Link>
            <Link href="/signup" onClick={() => setMobile(false)}>
              <Pill variant="primary" className="mt-4 w-full">
                Sign up free
              </Pill>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
