-- Idempotency table for Stripe webhook deliveries.
-- Stripe guarantees at-least-once delivery; this table lets the webhook handler
-- short-circuit on replays so non-idempotent side-effects (emails, audit logs,
-- credit grants) cannot double-fire when Stripe retries after a 5xx response.

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lock the table down. The webhook handler uses the service role key which
-- bypasses RLS; no other principal should be able to read or write this table.
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Background cleanup: keep only the last 90 days. Stripe replays expire well
-- before that, so older rows are purely audit residue.
-- (Optional — uncomment if pg_cron is enabled in the project.)
-- SELECT cron.schedule(
--   'purge_processed_webhook_events',
--   '0 3 * * *',
--   $$DELETE FROM public.processed_webhook_events WHERE processed_at < now() - INTERVAL '90 days'$$
-- );
