-- Scheduled edge-function calls now authenticate.
--
-- The cron-triggered edge functions (close-auctions, airtable-pull-sync,
-- airtable-push-sync, market-intel-ingest, grant-ingest) now FAIL CLOSED:
-- they accept only the service-role key or an x-cron-secret header matching
-- the CRON_SECRET edge-function secret. Before this change the pg_cron jobs
-- sent no header at all.
--
-- This migration (re)schedules each job to read the secret from Supabase
-- Vault at run time, so the secret is never stored in cron.job.command.
--
-- ONE-TIME SETUP (run once per project, same value in both places):
--   1. supabase secrets set CRON_SECRET=<value>
--   2. select vault.create_secret('<value>', 'cron_secret');
--      (to rotate: select vault.update_secret(id, '<new>') from vault.secrets where name = 'cron_secret';)
--
-- Any existing job that calls one of these functions is replaced, keeping its
-- current schedule when it has one; otherwise the default below is used.

DO $$
DECLARE
  v_base   text := 'https://vuekwckknfjivjighhfd.supabase.co/functions/v1/';
  v_job    record;
  v_sched  text;
  v_target record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     OR NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE 'pg_cron/pg_net not installed; skipping cron rescheduling';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault') THEN
    RAISE WARNING 'supabase_vault not installed; cron jobs will not be able to authenticate';
  ELSIF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret') THEN
    RAISE WARNING 'Vault secret "cron_secret" is missing. Run: select vault.create_secret(''<CRON_SECRET value>'', ''cron_secret'');';
  END IF;

  FOR v_target IN
    SELECT * FROM (VALUES
      ('close-auctions',       'close-auctions',            '*/5 * * * *'),
      ('airtable-pull-sync',   'airtable-pull-sync-15m',    '*/15 * * * *'),
      ('airtable-push-sync',   'airtable-push-sync-15m',    '*/15 * * * *'),
      ('market-intel-ingest',  'market-intel-ingest',       '*/30 * * * *'),
      ('grant-ingest',         'grant-ingest-daily',        '0 6 * * *')
    ) AS t(fn, jobname, default_schedule)
  LOOP
    v_sched := NULL;

    -- Find existing jobs for this function (by name or by URL in the command).
    FOR v_job IN
      SELECT jobid, jobname, schedule FROM cron.job
      WHERE jobname = v_target.jobname
         OR command ILIKE '%/functions/v1/' || v_target.fn || '%'
    LOOP
      v_sched := COALESCE(v_sched, v_job.schedule);
      PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
      v_target.jobname,
      COALESCE(v_sched, v_target.default_schedule),
      format(
        $cmd$
        select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', coalesce(
              (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1),
              ''
            )
          ),
          body := '{}'::jsonb
        ) as request_id;
        $cmd$,
        v_base || v_target.fn
      )
    );
  END LOOP;
END;
$$;
