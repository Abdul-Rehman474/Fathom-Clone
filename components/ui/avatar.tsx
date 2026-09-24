'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

/** Deterministic solid colour from a name: Carbon + Lime family only. */
const PALETTE = ['#C8FF3D', '#9FC92F', '#D7FF68', '#F3F5EF', '#B8C2AE', '#9BA298'];
export function colorFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  className,
  size = 32,
}: {
  name: string;
  src?: string | null;
  className?: string;
  size?: number;
}) {
  const bg = colorFromString(name);
  return (
    <AvatarPrimitive.Root
      className={cn('inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-sans font-semibold text-black"
        style={{ backgroundColor: bg, fontSize: size * 0.4 }}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
