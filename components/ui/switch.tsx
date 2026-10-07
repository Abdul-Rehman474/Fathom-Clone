'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Toggle 44×24 (designPlan.md §6). Off: surface-3 with ⊗. On: cyan with ✓. */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-cyan data-[state=unchecked]:bg-surface-3',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none flex h-5 w-5 translate-x-0.5 items-center justify-center rounded-full bg-white text-black transition-transform data-[state=checked]:translate-x-[22px]">
      <Check className="hidden size-3 data-[state=checked]:block" />
    </SwitchPrimitive.Thumb>
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

/** Small icon variant of the knob content, used purely for the visual spec. */
export { Check, X };
