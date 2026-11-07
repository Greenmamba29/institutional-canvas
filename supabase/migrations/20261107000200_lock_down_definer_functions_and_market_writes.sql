-- Lock down anonymous access to privileged database code and market data.
--
-- 1. Market data write policies.
--    Policies named "Service write/update ..." on the market tables had no
--    TO clause, so they applied to every role, including anon. Anyone with the
--    public anon key could insert or rewrite prices, KPIs, news, arbitrage
--    rows and briefings shown to all users. The service role bypasses RLS
--    and never needed these policies, so they are dropped. Public read stays.
--    auction_notifications rows are written only by place_auction_bid()
--    (SECURITY DEFINER), which also bypasses RLS.
DROP POLICY IF EXISTS "Service write market_prices"             ON public.market_prices;
DROP POLICY IF EXISTS "Service update market_prices"            ON public.market_prices;
DROP POLICY IF EXISTS "Service write market_kpis"               ON public.market_kpis;
DROP POLICY IF EXISTS "Service update market_kpis"              ON public.market_kpis;
DROP POLICY IF EXISTS "Service write market_news"               ON public.market_news;
DROP POLICY IF EXISTS "Service write market_briefings"          ON public.market_briefings;
DROP POLICY IF EXISTS "Service update market_briefings"         ON public.market_briefings;
DROP POLICY IF EXISTS "Service write arbitrage_opportunities"   ON public.arbitrage_opportunities;
DROP POLICY IF EXISTS "Service update arbitrage_opportunities"  ON public.arbitrage_opportunities;
DROP POLICY IF EXISTS "System can insert auction notifications" ON public.auction_notifications;

-- 2. SECURITY DEFINER functions.
--    Postgres grants EXECUTE on new functions to PUBLIC, and Supabase also
--    grants it to anon. SECURITY DEFINER functions run with the owner's
--    rights and bypass RLS, so anonymous callers could invoke ~90 of them
--    through /rest/v1/rpc. Restrict them to signed-in users and the service
--    role. Exceptions: helpers referenced by RLS policies must stay callable
--    by anon, or public-read tables whose policies call them would error.
DO $$
DECLARE
  f record;
  keep_anon text[] := ARRAY['is_org_member', 'is_super_admin', 'has_capability', 'has_active_subscription'];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prokind = 'f'
      -- skip functions owned by extensions
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    IF f.proname = ANY (keep_anon) THEN
      CONTINUE;
    END IF;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
  END LOOP;
END;
$$;

-- NOTE: new SECURITY DEFINER functions still get PUBLIC execute by default.
-- Every migration that creates one must add:
--   REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM PUBLIC, anon;
--   GRANT EXECUTE ON FUNCTION public.<fn>(<args>) TO authenticated;
