import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Plan } from '@/lib/auth/plans';

// Reuse the server client type so callers can pass either a cookie-bound
// `createClient()` or the `createServiceClient()` instance without typing friction.
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetch the authenticated user's plan from `user_profiles`.
 *
 * Pass the Supabase client from the call site whenever possible to avoid a
 * second cookie-parsing round-trip per request — most authed handlers already
 * built a client to call `auth.getUser()`.
 */
export async function getUserPlan(
  userId: string,
  client?: SupabaseServerClient,
): Promise<Plan> {
  const supabase = client ?? (await createClient());
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  return (profile?.plan as Plan) || 'free';
}
