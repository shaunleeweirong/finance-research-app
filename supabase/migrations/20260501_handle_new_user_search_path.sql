-- Pin search_path to '' for the auth signup trigger function.
-- Resolves Supabase advisor lint 0011 (Function Search Path Mutable).
-- Without this, an attacker who can create objects in any schema reachable
-- via the connection's search_path could shadow built-in operators or
-- functions referenced inside the SECURITY DEFINER body. Setting it to ''
-- forces every reference inside the function to be schema-qualified.
--
-- The function body itself was originally created in the user_profiles
-- migration; here we just lock down its environment.

ALTER FUNCTION public.handle_new_user() SET search_path = '';
