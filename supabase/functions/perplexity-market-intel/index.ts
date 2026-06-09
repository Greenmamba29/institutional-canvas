// DECOMMISSIONED: perplexity-market-intel
//
// Perplexity has been removed. Market intelligence (news) is now ingested by the
// Firecrawl-powered `market-intel-ingest` edge function (30-min pg_cron) into the
// Supabase `market_news` table, and read directly by the frontend
// (market-intel.service.ts -> queryMarketIntel). This stub remains only so the
// slug resolves; it performs no work.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      deprecated: true,
      message:
        "perplexity-market-intel is decommissioned. Market intelligence is now sourced via market-intel-ingest (Firecrawl) into Supabase market_news; read it directly.",
    }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
