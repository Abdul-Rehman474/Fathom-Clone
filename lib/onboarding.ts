/** Onboarding step order (architecture.md §8, UI.md §3). */
export const ONBOARDING_STEPS = [
  'account-type',
  'preferences',
  'about-you',
  'usage',
  'connect',
  'first-call',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export const ONBOARDING_TOTAL = ONBOARDING_STEPS.length;

/** 1-based step number → slug (clamped). */
export function stepSlug(step: number): OnboardingStep {
  const i = Math.min(Math.max(step, 1), ONBOARDING_TOTAL) - 1;
  return ONBOARDING_STEPS[i];
}

/** slug → 1-based step number. */
export function slugStep(slug: string): number {
  const i = ONBOARDING_STEPS.indexOf(slug as OnboardingStep);
  return i === -1 ? 1 : i + 1;
}

/** Where a user should land after auth, given their onboarding progress. */
export function postAuthPath(
  onboarding_done: boolean,
  onboarding_step: number,
  fallback = '/calls',
): string {
  if (onboarding_done) return fallback;
  return `/onboarding/${stepSlug(onboarding_step || 1)}`;
}
