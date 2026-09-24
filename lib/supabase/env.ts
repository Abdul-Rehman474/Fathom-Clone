/**
 * Environment values pasted into a hosting dashboard sometimes carry extra
 * lines or spaces (seen in production: the Supabase URL repeated on several
 * lines, which broke Google sign-in). Use the first non-empty line, trimmed.
 * NEXT_PUBLIC_* names are written out literally so Next.js can inline them.
 */
export function cleanEnv(value: string | undefined): string {
  return (value ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? '';
}

export const SUPABASE_URL = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SITE_URL = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, '');
