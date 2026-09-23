'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PLATFORMS = [
  { value: 'all', label: 'All platforms' },
  { value: 'meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'teams', label: 'Teams' },
  { value: 'upload', label: 'Upload' },
  { value: 'browser', label: 'Tab recording' },
];

export function CallsFilterBar({
  platform,
  sort,
  hasActionItems,
}: {
  platform: string;
  sort: string;
  hasActionItems: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '' || value === 'all' || value === 'false') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={platform} onValueChange={(v) => setParam('platform', v)}>
        <SelectTrigger className="h-9 w-44 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLATFORMS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => setParam('sort', v === 'newest' ? null : v)}>
        <SelectTrigger className="h-9 w-32 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
        </SelectContent>
      </Select>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-text-2">
        <Checkbox
          checked={hasActionItems}
          onCheckedChange={(v) => setParam('actions', v === true ? 'true' : null)}
        />
        Has action items
      </label>
    </div>
  );
}
