'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** App button (designPlan.md §6). Rounded rectangles, sentence case. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-sans font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-lime text-carbon hover:-translate-y-px hover:bg-lime-bright',
        secondary: 'bg-surface-2 text-text-1 hover:bg-surface-3',
        tint: 'bg-cyan-tint text-lime hover:brightness-125',
        danger: 'bg-danger-tint text-danger hover:brightness-125',
        ghost: 'text-text-2 hover:bg-surface-2 hover:text-text-1',
        outline: 'border border-border-strong text-text-1 hover:border-lime/60 hover:text-lime',
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
  'inline-flex h-12 items-center justify-center rounded-pill px-8 font-pill text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-lime text-carbon hover:bg-lime-bright',
        secondary: 'border border-off-white/40 text-off-white hover:border-lime hover:text-lime',
        outline: 'border border-off-white/40 text-off-white hover:border-lime hover:text-lime',
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
