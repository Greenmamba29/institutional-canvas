import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// This function previously pulled market data from Make.com Data Stores.
// It has been replaced by the Airtable → Supabase pipeline:
//   Airtable Automation (on record update) → POST /functions/v1/airtable-market-webhook
//
// To configure in Airtable:
//   1. Open base appu9fRT4qFBCf8wL
//   2. For each table (Market Prices, Dashboard KPIs, Market News, Arbitrage Opportunities):
//      Automations → When record updated → Run webhook → POST to:
//      https://<project-ref>.supabase.co/functions/v1/airtable-market-webhook
//      Body: { "table": "<Table Name>", "record": <record fields>, "action": "update", "recordId": "<airtable record id>" }
//   3. Set header: x-airtable-signature = <AIRTABLE_WEBHOOK_SECRET>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (Deno.env.get('MARKET_DATA_DISABLED') === 'true') {
    return new Response(JSON.stringify({ disabled: true, message: 'Market data now sourced from Airtable' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  return new Response(
    JSON.stringify({
      deprecated: true,
      message: 'Market data is now sourced directly from Airtable via airtable-market-webhook. Configure Airtable Automations to POST to /functions/v1/airtable-market-webhook on record changes.',
    }),
    {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
