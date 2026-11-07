-- Remove the legacy third-party automation webhook RPC.
-- It was SECURITY DEFINER with default PUBLIC execute, so anon callers could
-- insert market prices, KPIs, news, arbitrage and briefings via /rest/v1/rpc.
-- Market data now arrives only through market-intel-ingest and the Airtable sync.
DROP FUNCTION IF EXISTS public.handle_make_webhook(jsonb);
