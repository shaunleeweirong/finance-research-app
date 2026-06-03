import 'server-only';
import type { createServiceClient } from '@/lib/supabase/server';

// Thin wrapper over the `check_rate_limit(user_id, scope, max, window_seconds)`
// SQL function (see supabase/migrations/20260603_create_rate_limit_buckets.sql).
// The function is SECURITY DEFINER with EXECUTE revoked from public/anon/
// authenticated, so callers MUST hand in a service-role client.
//
// Fails open on RPC error — a transient Supabase blip shouldn't block
// legitimate users. The downside is a brief window where the limit is
// effectively disabled; we accept that for availability.
export async function isRateLimited(
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  scope: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await serviceClient.rpc('check_rate_limit', {
    p_user_id: userId,
    p_scope: scope,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('rate_limit_rpc_failed', {
      scope,
      code: error.code,
      message: error.message,
    });
    return false;
  }
  return data === true;
}
