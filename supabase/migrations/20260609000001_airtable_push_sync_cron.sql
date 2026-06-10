-- Schedule the Supabase -> Airtable push sync every 15 minutes.
--
-- Symmetric to the existing airtable-pull-sync-15m job. The edge function
-- (supabase/functions/airtable-push-sync) refreshes platform KPIs and upserts
-- market_kpis (merge on metric_name) and orders (merge on Supabase_ID) into
-- Airtable. KPIs are push-only — the Dashboard KPIs entry was removed from
-- airtable-pull-sync to avoid a bidirectional conflict.
--
-- Guarded so the migration still applies where pg_cron is unavailable.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('airtable-push-sync-15m')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'airtable-push-sync-15m');

    PERFORM cron.schedule(
      'airtable-push-sync-15m',
      '*/15 * * * *',
      $cron$
      select net.http_post(
        url := 'https://vuekwckknfjivjighhfd.supabase.co/functions/v1/airtable-push-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', coalesce(current_setting('app.settings.cron_secret', true), '')
        ),
        body := '{}'::jsonb
      ) as request_id;
      $cron$
    );
  END IF;
END;
$$;
