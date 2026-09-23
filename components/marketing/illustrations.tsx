/** Flat, solid-colour SVG illustrations (designPlan.md §8): no gradients, no
 *  filters, at most a few solid colours each. Decorative → aria-hidden. */

export function Planet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <circle cx="60" cy="60" r="40" fill="#9B1CFF" />
      <circle cx="46" cy="50" r="8" fill="#FF9EC7" />
      <circle cx="74" cy="70" r="5" fill="#FF9EC7" />
      <ellipse cx="60" cy="60" rx="56" ry="14" stroke="#FF9EC7" strokeWidth="3" transform="rotate(-20 60 60)" />
    </svg>
  );
}

export function Moon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <circle cx="60" cy="60" r="42" fill="#00B8F5" />
      <circle cx="48" cy="46" r="7" fill="#FFFFFF" opacity="0.5" />
      <circle cx="72" cy="66" r="10" fill="#FFFFFF" opacity="0.4" />
      <circle cx="54" cy="78" r="5" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
}

export function Rocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <path d="M60 12c16 10 22 30 22 48l-14 12H52L38 60c0-18 6-38 22-48Z" fill="#00B8F5" />
      <circle cx="60" cy="46" r="8" fill="#1B1B1D" />
      <path d="M38 66 26 82l16-4Zm44 0 12 16-16-4Z" fill="#9B1CFF" />
      <path d="M52 72h16l-4 20-4 8-4-8Z" fill="#FF7A1A" />
    </svg>
  );
}

export function Astronaut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <circle cx="60" cy="52" r="26" fill="#FFFFFF" />
      <circle cx="60" cy="52" r="16" fill="#1B1B1D" />
      <circle cx="54" cy="48" r="5" fill="#00B8F5" />
      <rect x="42" y="74" width="36" height="30" rx="10" fill="#FFFFFF" />
      <rect x="52" y="82" width="16" height="10" rx="3" fill="#9B1CFF" />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 0l2.4 7.2L22 9.6l-7.6 2.4L12 24l-2.4-12L2 9.6l7.6-2.4z" opacity="0.9" />
    </svg>
  );
}
