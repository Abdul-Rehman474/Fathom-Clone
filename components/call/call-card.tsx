'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MoreVertical, Video, Play, ListChecks, Star, Loader2 } from 'lucide-react';
import type { CallCardData } from '@/lib/queries';
import type { Platform } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { secToDurationLabel, formatDate } from '@/lib/time';
import { isTerminal } from '@/lib/pipeline/status';
import { toast } from '@/components/ui/toaster';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PLATFORM: Record<Platform, { label: string; color: string }> = {
  meet: { label: 'Meet', color: '#00A67E' },
  zoom: { label: 'Zoom', color: '#2D8CFF' },
  teams: { label: 'Teams', color: '#5B5FC7' },
  upload: { label: 'Upload', color: '#7C7C86' },
  browser: { label: 'Recording', color: '#00B8F5' },
};

export function CallCard({ call }: { call: CallCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const platform = PLATFORM[call.platform];
  const ready = call.status === 'ready';
  const failed = call.status === 'failed';
  const processing = !isTerminal(call.status);

  async function retry(e: React.MouseEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/calls/${call.id}/retry`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      toast.success('Retrying…');
      router.refresh();
    } else {
      toast.error('Could not retry');
    }
  }

  return (
    <Link
      href={`/calls/${call.id}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-1 transition-colors hover:bg-surface-2"
    >
      {/* thumbnail / platform tile */}
      <div className="relative aspect-video">
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: `${platform.color}22` }}
        >
          <Video className="size-10" style={{ color: platform.color }} />
        </div>

        {ready && (
          <span className="absolute bottom-2 right-2 rounded-chip px-1.5 py-0.5 text-xs text-white tnum" style={{ backgroundColor: '#000000CC' }}>
            {secToDurationLabel(call.duration_sec)}
          </span>
        )}

        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#000000CC' }}>
            <StatusBadge status={call.status} />
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#000000CC' }}>
            <StatusBadge status="failed" />
            <button onClick={retry} disabled={busy} className="rounded-btn bg-danger-tint px-3 py-1 text-xs font-semibold text-danger">
              {busy ? <Loader2 className="size-3 animate-spin" /> : 'Retry'}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-sm font-semibold text-text-1">
            {call.title ?? 'Untitled recording'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <button className="shrink-0 rounded-btn p-1 text-text-3 opacity-0 transition-opacity hover:bg-surface-3 group-hover:opacity-100">
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
              <DropdownMenuItem onSelect={() => router.push(`/calls/${call.id}`)}>
                <Play /> Open
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="text-xs text-text-3 tnum">{formatDate(call.created_at)}</span>
        <div className="mt-1 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-cyan">
            <Star className="size-3" /> {call.highlightCount}
          </span>
          <span className="flex items-center gap-1 text-gold">
            <ListChecks className="size-3" /> {call.actionCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
