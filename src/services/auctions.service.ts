/**
 * Auctions Service - Lithium & Lux RPC Layer
 * 
 * Uses list_auctions and place_auction_bid RPCs with input validation.
 * All write operations require an authenticated Supabase client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { placeAuctionBidSchema, validateInput, type PlaceAuctionBidInput } from '@/lib/validation/schemas';
import type { Tables, Database } from '@/integrations/supabase/types';

export type Auction = Tables<'auctions'>;
export type AuctionBid = Tables<'auction_bids'>;

/**
 * List all auctions (authenticated)
 */
export async function listAuctions(
  client: SupabaseClient<Database>
): Promise<{ data: Auction[] | null; error: Error | null }> {
  return callAuthenticatedRpc<Auction[]>(client, 'list_auctions');
}

/**
 * Get a single auction by ID (direct read - RLS protected)
 */
export async function getAuctionById(auctionId: string) {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .single();
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get bids for an auction (direct read - RLS protected)
 */
export async function getAuctionBids(auctionId: string) {
  const { data, error } = await supabase
    .from('auction_bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false });
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Place a bid on an auction with validated input (authenticated)
 */
export async function placeAuctionBid(
  client: SupabaseClient<Database>,
  params: PlaceAuctionBidInput
): Promise<{ data: AuctionBid | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(placeAuctionBidSchema, params);
  return callAuthenticatedRpc<AuctionBid>(client, 'place_auction_bid', validated);
}
