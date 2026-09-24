'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CallCardData } from '@/lib/queries';
import type { Platform } from '@/lib/types';
import { secToDurationLabel, formatDate } from '@/lib/time';
import { isTerminal } from '@/lib/pipeline/status';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from '@/components/ui/toaster';

const PLATFORM_LABEL: Record<Platform, string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  upload: 'Upload',
  browser: 'Tab recording',
};

/** Editorial meeting row (design §13): thin borders, strong type, subtle hover. */
export function MeetingRow({ call }: { call: CallCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
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
    } else toast.error('Could not retry');
  }

  return (
    <Link
      href={`/calls/${call.id}`}
      className="group block border-b border-border py-5 transition-transform duration-200 hover:translate-x-0.5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold text-off-white group-hover:text-lime">
            {call.title ?? 'Untitled recording'}
          </h3>
          <p className="mt-1 text-sm text-muted tnum">
            {PLATFORM_LABEL[call.platform]}
            {ready && <> · {secToDurationLabel(call.duration_sec)}</>} · {formatDate(call.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5 sm:pt-0.5">
          {ready && (
            <>
              <span className="text-sm text-muted tnum">
                <span className="text-off-white">{call.highlightCount}</span> highlights
              </span>
              <span className="text-sm text-muted tnum">
                <span className="text-off-white">{call.actionCount}</span> actions
              </span>
            </>
          )}
          {processing && <StatusBadge status={call.status} />}
          {failed && (
            <button
              onClick={retry}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-btn bg-danger-tint px-2.5 py-1 text-xs font-semibold text-danger"
            >
              {busy ? <Loader2 className="size-3 animate-spin" /> : 'Failed · Retry'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
