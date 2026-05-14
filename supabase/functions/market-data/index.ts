/**
 * DEPRECATED: Make.com Market Data Fetcher
 *
 * Make.com integration has been removed. All market data now syncs through
 * Airtable automations → airtable-market-webhook edge function.
 *
 * This endpoint returns 410 Gone to fail loudly if any stale callers remain.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() =>
  new Response(
    JSON.stringify({
      error: "Deprecated",
      message: "Make.com integration removed. Use Airtable automations → airtable-market-webhook.",
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    }
  )
);
