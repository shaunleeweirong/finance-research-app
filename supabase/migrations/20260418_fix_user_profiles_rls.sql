-- Fix CRITICAL RLS bug: user_profiles_update_own allowed any authenticated user
-- to UPDATE their own row (including the `plan` column), enabling client-side
-- self-promotion to 'premium' via `supabase.from('user_profiles').update(...)`.
--
-- All legitimate writes to user_profiles come from:
--   1) The Stripe webhook (src/app/api/stripe/webhook/route.ts) using createServiceClient()
--   2) The on_auth_user_created trigger (runs as security definer)
-- Both paths use the service role, which bypasses RLS. There is no legitimate
-- client-side update path, so drop the policy entirely.

drop policy if exists "user_profiles_update_own" on public.user_profiles;
