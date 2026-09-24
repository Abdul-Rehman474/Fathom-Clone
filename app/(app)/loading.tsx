/** Loading state for every app screen while its data is fetched. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-4xl space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="h-4 w-32 animate-pulse rounded bg-surface-2" aria-hidden />
      <div className="h-10 w-2/3 animate-pulse rounded bg-surface-2" aria-hidden />
      <div className="space-y-3 pt-6" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-surface-1" />
        ))}
      </div>
    </div>
  );
}
