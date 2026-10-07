/** Time helpers. ms ↔ m:ss / h:mm:ss (UI.md §0). */

/** 154000 → "2:34", 3723000 → "1:02:03". */
export function msToClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Duration in whole minutes, e.g. "42 min" / "1 min". */
export function secToDurationLabel(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return '0 min';
  const mins = Math.round(sec / 60);
  return `${mins} min`;
}

/** "Sep 21, 2026". */
export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "September 2026": used for month grouping. */
export function formatMonth(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
