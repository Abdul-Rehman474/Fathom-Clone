import { BRAND_NAME } from '@/lib/config';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex items-center gap-2">
        <span className="flex h-8 items-end gap-[3px]" aria-hidden>
          <span className="h-3 w-[3px] rounded-full bg-cyan" />
          <span className="h-6 w-[3px] rounded-full bg-cyan" />
          <span className="h-4 w-[3px] rounded-full bg-cyan" />
        </span>
        <span className="font-sans text-lg font-semibold tracking-wide">{BRAND_NAME}</span>
      </div>

      <h1 className="font-display text-5xl leading-tight font-light tracking-tight sm:text-7xl">
        AI notetaking that is
        <br />
        <span className="font-semibold text-orange">out of this world</span>
      </h1>

      <p className="max-w-xl font-sans text-base text-text-2">
        Foundation is live — design tokens, fonts and Tailwind theme are wired. The full
        product is being built slice by slice.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {(['cyan', 'yellow', 'orange', 'gold', 'purple', 'pink'] as const).map((c) => (
          <span
            key={c}
            className="rounded-chip border px-3 py-1 font-mono text-xs tnum"
            style={{ color: `var(--${c})`, borderColor: `var(--${c})` }}
          >
            --{c}
          </span>
        ))}
      </div>
    </main>
  );
}
