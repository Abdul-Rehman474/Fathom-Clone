'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-btn border border-border bg-surface-2 px-3 py-2 text-sm text-text-1 transition-colors placeholder:text-text-3 focus-visible:border-cyan disabled:cursor-not-allowed disabled:opacity-50 scroll-styled',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
