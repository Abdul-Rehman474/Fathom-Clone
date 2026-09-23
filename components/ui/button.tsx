'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** App button (designPlan.md §6). Rounded rectangles, sentence case. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-sans font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-cyan text-black hover:bg-cyan-press',
        secondary: 'bg-surface-2 text-text-1 hover:bg-surface-3',
        tint: 'bg-cyan-tint text-cyan hover:brightness-125',
        danger: 'bg-danger-tint text-danger hover:brightness-125',
        ghost: 'text-text-2 hover:bg-surface-2 hover:text-text-1',
        outline: 'border border-border-strong text-text-1 hover:bg-surface-2',
      },
      size: {
        sm: 'h-9 px-3 text-[13px] [&_svg]:size-4',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        icon: 'h-9 w-9 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

/** Marketing pill CTA (designPlan.md §6): uppercase, condensed, radius 999. */
const pillVariants = cva(
  'inline-flex h-14 items-center justify-center rounded-pill px-10 font-pill text-lg font-medium uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-cyan text-black hover:bg-cyan-press',
        secondary: 'bg-yellow text-black hover:brightness-95',
        outline: 'border-[1.5px] border-cyan text-cyan hover:bg-cyan-tint',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export interface PillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillVariants> {
  asChild?: boolean;
}

export const Pill = React.forwardRef<HTMLButtonElement, PillProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(pillVariants({ variant }), className)} {...props} />;
  },
);
Pill.displayName = 'Pill';

export { buttonVariants };
