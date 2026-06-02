-- Durable per-user rate limiter for expensive endpoints (Perplexity summaries).
-- Replaces the in-memory Map that lived in src/app/api/stock/summary/[ticker]/route.ts,
-- which reset on cold starts and was bypassable by fanning across serverless isolates.

create table if not exists public.rate_limit_buckets (
  user_id uuid not null,
  scope text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (user_id, scope, window_start)
);

create index if not exists rate_limit_buckets_window_idx
  on public.rate_limit_buckets (window_start);

-- Lock the table down. Only the service role (used by the API route) should
-- read or write; no policies are granted to anon/authenticated.
alter table public.rate_limit_buckets enable row level security;

-- Atomic check-and-increment. Floors `now()` to the start of the active window
-- so calls inside the same window share a bucket. Returns true when the caller
-- has exceeded `p_max` within that bucket. Opportunistically prunes expired
-- buckets for the same (user, scope) on each call so the table stays small
-- without needing a cron job.
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_scope text,
  p_max int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count int;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  delete from public.rate_limit_buckets
  where user_id = p_user_id
    and scope = p_scope
    and window_start < v_window_start;

  insert into public.rate_limit_buckets (user_id, scope, window_start, count)
  values (p_user_id, p_scope, v_window_start, 1)
  on conflict (user_id, scope, window_start)
  do update set count = public.rate_limit_buckets.count + 1
  returning count into v_count;

  return v_count > p_max;
end;
$$;

comment on table public.rate_limit_buckets is 'Per-(user, scope) counters for fixed-window rate limiting. Service-role only.';
comment on function public.check_rate_limit is 'Atomically increment a rate-limit bucket and return true if the caller has exceeded the limit in the current window.';
