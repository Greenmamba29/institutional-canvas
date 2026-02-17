import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Step 1: Close expired auctions via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('close_ended_auctions');
    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const closedCount = rpcResult?.closed ?? 0;
    console.log(`Closed ${closedCount} auctions`);

    if (closedCount === 0) {
      return new Response(
        JSON.stringify({ closed: 0, synced_auctions: 0, synced_bids: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch recently ended auctions (updated in last 2 minutes)
    const { data: endedAuctions, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'ended')
      .gte('updated_at', new Date(Date.now() - 2 * 60 * 1000).toISOString());

    if (auctionError) {
      console.error('Failed to fetch ended auctions:', auctionError.message);
    }

    const auctions = endedAuctions ?? [];
    let syncedAuctions = 0;
    let syncedBids = 0;

    // Step 3: Sync each auction and its bids to Airtable
    for (const auction of auctions) {
      try {
        // Sync auction record
        await fetch(`${SUPABASE_URL}/functions/v1/sync-to-airtable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ table: 'auctions', record: auction }),
        });
        syncedAuctions++;

        // Fetch and sync all bids for this auction
        const { data: bids } = await supabase
          .from('auction_bids')
          .select('*')
          .eq('auction_id', auction.id);

        if (bids && bids.length > 0) {
          await fetch(`${SUPABASE_URL}/functions/v1/sync-to-airtable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ table: 'auction_bids', records: bids }),
          });
          syncedBids += bids.length;
        }
      } catch (syncErr) {
        console.error(`Airtable sync failed for auction ${auction.id}:`, syncErr);
      }
    }

    console.log(`Synced ${syncedAuctions} auctions, ${syncedBids} bids to Airtable`);

    return new Response(
      JSON.stringify({ closed: closedCount, synced_auctions: syncedAuctions, synced_bids: syncedBids }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('close-auctions error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
