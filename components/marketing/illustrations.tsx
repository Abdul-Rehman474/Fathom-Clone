/** Flat SVG illustrations in the Carbon + Lime palette: lime, off-white and
 *  carbon tones only: no gradients, filters or off-system colours.
 *  Decorative → aria-hidden. */

const LIME = '#C8FF3D';
const LIME_DARK = '#9FC92F';
const OFF_WHITE = '#F3F5EF';
const CARBON_SOFT = '#181B17';
const CARBON_LINE = '#2A2F26';

export function Planet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <circle cx="60" cy="60" r="38" fill={CARBON_SOFT} stroke={CARBON_LINE} strokeWidth="2" />
      <circle cx="47" cy="50" r="7" fill={CARBON_LINE} />
      <circle cx="73" cy="70" r="4.5" fill={CARBON_LINE} />
      <ellipse cx="60" cy="60" rx="56" ry="13" stroke={LIME} strokeWidth="2.5" transform="rotate(-18 60 60)" />
    </svg>
  );
}

export function Moon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <circle cx="60" cy="60" r="42" fill={LIME} />
      <circle cx="47" cy="46" r="7" fill={LIME_DARK} />
      <circle cx="72" cy="66" r="10" fill={LIME_DARK} />
      <circle cx="53" cy="79" r="4.5" fill={LIME_DARK} />
    </svg>
  );
}

export function Rocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <path d="M60 12c16 10 22 30 22 48l-14 12H52L38 60c0-18 6-38 22-48Z" fill={OFF_WHITE} />
      <circle cx="60" cy="46" r="8" fill={CARBON_SOFT} />
      <path d="M38 66 26 82l16-4Zm44 0 12 16-16-4Z" fill={CARBON_LINE} />
      <path d="M52 72h16l-4 20-4 8-4-8Z" fill={LIME} />
    </svg>
  );
}

export function Astronaut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <circle cx="60" cy="52" r="26" fill={OFF_WHITE} />
      <circle cx="60" cy="52" r="16" fill={CARBON_SOFT} />
      <circle cx="54" cy="48" r="4" fill={LIME} />
      <rect x="42" y="74" width="36" height="30" rx="10" fill={OFF_WHITE} />
      <rect x="52" y="82" width="16" height="10" rx="3" fill={LIME} />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 0l2.4 7.2L22 9.6l-7.6 2.4L12 24l-2.4-12L2 9.6l7.6-2.4z" />
    </svg>
  );
}
