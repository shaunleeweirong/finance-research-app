-- Surfaced by Supabase advisor lints 0028/0029 (same class as the
-- check_rate_limit revoke in 20260603_create_rate_limit_buckets.sql).
--
-- public.handle_new_user() is SECURITY DEFINER and intended only to be fired
-- by the on_auth_user_created trigger. PostgREST exposes any public function
-- at /rest/v1/rpc/<name> unless EXECUTE is revoked, so without this an
-- unauthenticated caller can invoke handle_new_user() directly. The function
-- takes no arguments and the trigger context binds `new`, so calling it
-- outside the trigger will fail on the NOT NULL constraint today — but the
-- exposure is defense-in-depth erosion: a future refactor that gives the
-- function parameters or side effects inherits a wide-open RPC surface.
--
-- The trigger itself runs as the table owner (postgres), not as anon or
-- authenticated, so revoking EXECUTE from those roles does not break signup.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
