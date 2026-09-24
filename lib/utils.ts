import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A redirect target from the URL, only if it is a path on this site. Rejects
 * absolute URLs, protocol-relative `//host`, backslashes and `@host` tricks
 * that turn `origin + next` into another site.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/calls'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || /[\@\s]/.test(next)) return fallback;
  return next;
}
