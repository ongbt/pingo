-- Phase 11A: Server-Side Session Cleanup
-- Enables pg_cron and schedules expire_stale_sessions to run automatically

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule expire_stale_sessions to run every 5 minutes
SELECT cron.schedule('expire_stale_sessions_job', '*/5 * * * *', $$
  SELECT public.expire_stale_sessions();
$$);
