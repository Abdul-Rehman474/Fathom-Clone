import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, cleanEnv } from '@/lib/supabase/env';

/**
 * Service-role client: BYPASSES RLS. Server only.
 * Used exclusively for: webhook handlers (no user session), public share-page
 * reads after token checks, and the delete-account admin route.
 * The `server-only` import makes importing this from a client bundle a build
 * error (architecture.md §11).
 */
export function createAdminClient() {
  return createClient(
    SUPABASE_URL,
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
