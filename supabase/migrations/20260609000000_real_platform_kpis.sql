-- Real platform KPIs
--
-- The market_kpis table (public read, service write, Airtable-synced via
-- sync-to-airtable / airtable-pull-sync) previously held hardcoded seed values
-- for total_buyers / total_suppliers. The client (useGMVStats) tried to count
-- verified buyers directly from `organizations`, which is blocked by the
-- organizations_select_member_only RLS policy (returns 404 for non-members).
--
-- This migration replaces the fabricated KPIs with a SECURITY DEFINER function
-- that computes the real counts (bypassing RLS) and upserts them into
-- market_kpis, preserving previous_value / change_percent so the Airtable
-- mirror carries real, trend-aware numbers.

CREATE OR REPLACE FUNCTION public.refresh_platform_kpis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_start timestamptz := date_trunc('year', now());
  v_metric     record;
BEGIN
  -- Compute every metric from real rows (RLS bypassed via SECURITY DEFINER),
  -- then upsert each, carrying the prior value into previous_value and
  -- recomputing change_percent. Real data only — no fallbacks.
  FOR v_metric IN
    SELECT 'total_verified_suppliers' AS name,
           (SELECT count(*) FROM suppliers WHERE verification_tier IS NOT NULL)::numeric AS value
    UNION ALL
    SELECT 'total_buyers',
           (SELECT count(*) FROM organizations WHERE org_type = 'buyer' AND status = 'active')::numeric
    UNION ALL
    SELECT 'gmv_ytd',
           (SELECT COALESCE(sum(total_amount), 0) FROM orders
             WHERE payment_status = 'paid' AND created_at >= v_year_start)::numeric
  LOOP
    INSERT INTO market_kpis (metric_name, metric_value, previous_value, change_percent, updated_at)
    VALUES (v_metric.name, v_metric.value, NULL, NULL, now())
    ON CONFLICT (metric_name) DO UPDATE SET
      previous_value = market_kpis.metric_value,
      metric_value   = EXCLUDED.metric_value,
      change_percent = CASE
        WHEN market_kpis.metric_value IS NULL OR market_kpis.metric_value = 0 THEN NULL
        ELSE round(((EXCLUDED.metric_value - market_kpis.metric_value)
                    / market_kpis.metric_value) * 100, 2)
      END,
      updated_at = now();
  END LOOP;
END;
$$;

-- Let the client trigger an on-demand refresh (it is SECURITY DEFINER, so the
-- counts are computed with elevated rights but only ever return aggregate KPIs).
GRANT EXECUTE ON FUNCTION public.refresh_platform_kpis() TO authenticated, anon;

-- Replace the seeded placeholder values with real counts immediately.
SELECT public.refresh_platform_kpis();

-- Keep the Airtable-synced KPIs fresh. pg_cron is enabled in
-- 20260217052842_*. Guard so the migration still applies where cron is absent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('refresh-platform-kpis')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-platform-kpis');

    PERFORM cron.schedule(
      'refresh-platform-kpis',
      '*/15 * * * *',
      $cron$ SELECT public.refresh_platform_kpis(); $cron$
    );
  END IF;
END;
$$;
