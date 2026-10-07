'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Form submit button with a pending state while its server action runs. */
export function SubmitButton({
  className,
  disabled,
  pendingLabel,
  children,
}: {
  className?: string;
  disabled?: boolean;
  /** When set, replaces the label with a spinner + this text while pending. */
  pendingLabel?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn(className, pending && 'cursor-wait opacity-70')}
    >
      {pending && pendingLabel ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" /> {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
