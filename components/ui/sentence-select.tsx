'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * Inline dropdown that lives inside a sentence (designPlan.md §6, onboarding /
 * settings). Renders as a surface-2 pill with a chevron.
 */
export function SentenceSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          'inline-flex h-auto w-auto rounded-chip border-0 bg-surface-2 px-2.5 py-1 align-baseline text-inherit',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
