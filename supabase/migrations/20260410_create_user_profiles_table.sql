-- User profiles table for plan and Stripe linkage
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Users can read their own profile
create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile (plan changes come via service role / webhook)
create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if it already exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
