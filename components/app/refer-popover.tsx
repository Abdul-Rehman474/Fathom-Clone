'use client';

import { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BRAND_NAME } from '@/lib/config';

export function ReferPopover({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${inviteCode}`
      : `/invite/${inviteCode}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I'm using ${BRAND_NAME} for meeting notes — try it:`,
  )}&url=${encodeURIComponent(link)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1">
          <Gift className="size-4" /> Refer
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan">🎁 Referral code</p>
        <p className="mt-2 text-sm text-text-2">
          Give and get a month of Premium free when people sign up with your link.
        </p>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={link} className="text-xs" />
          <Button size="sm" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <a href={tweet} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Tweet
            </Button>
          </a>
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              LinkedIn
            </Button>
          </a>
        </div>
        <p className="mt-3 text-xs text-text-3">
          Want to partner with {BRAND_NAME}? Ask about the partner program.
        </p>
      </PopoverContent>
    </Popover>
  );
}
