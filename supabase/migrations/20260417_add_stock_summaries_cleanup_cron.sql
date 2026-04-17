-- Enable pg_cron extension (Supabase has it available but not enabled by default)
create extension if not exists pg_cron with schema pg_catalog;

-- Schedule daily cleanup of stale stock summaries at 3am UTC
-- Deletes rows older than 14 days (API TTL is 7 days; 14-day buffer for safety)
select cron.schedule(
  'cleanup-stale-stock-summaries',
  '0 3 * * *',
  $$DELETE FROM public.stock_summaries WHERE generated_at < now() - interval '14 days'$$
);
