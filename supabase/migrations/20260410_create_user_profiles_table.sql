-- User profiles table for plan and Stripe linkage.
-- This file is the ground-truth reflection of the live schema (dumped via MCP).
-- If you want to harden anything below, add a follow-up migration rather than
-- editing this file, so `supabase db reset` continues to reproduce prod.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Explicit service-role policy (service role already bypasses RLS; this is
-- belt-and-braces so dashboards/audits show the role's access clearly).
create policy "Service role full access"
  on public.user_profiles
  for all
  to service_role
  using (true)
  with check (true);

-- Users can read their own profile row. There are intentionally NO update
-- or insert policies for clients — writes happen via:
--   1) The Stripe webhook (src/app/api/stripe/webhook/route.ts, service role)
--   2) The on_auth_user_created trigger (security definer, runs as postgres)
create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
-- NOTE: prod's definition does not currently set `search_path = ''`, which
-- Supabase advisor lint 0011 warns on. Fix via a follow-up migration:
--   alter function public.handle_new_user() set search_path = '';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
