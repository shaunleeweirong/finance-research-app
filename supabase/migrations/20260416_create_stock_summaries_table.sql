-- Stock summaries cache table for AI-generated "What's Happening" narratives
-- Accessed via service role key from the API route (no RLS needed)
create table if not exists public.stock_summaries (
  ticker text primary key,
  summary text not null,
  citations jsonb default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  constraint stock_summaries_ticker_format check (ticker ~ '^[A-Z0-9.\-\^]{1,10}$')
);

-- Index for cache expiry lookups
create index if not exists stock_summaries_generated_idx
  on public.stock_summaries (generated_at desc);

-- Enable RLS — service role key bypasses RLS, anon/authenticated get zero access
alter table public.stock_summaries enable row level security;

comment on table public.stock_summaries is 'Cache for AI-generated stock narrative summaries with 7-day TTL';
