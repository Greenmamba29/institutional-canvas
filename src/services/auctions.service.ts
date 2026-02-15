/**
 * Auctions Service - Lithium & Lux RPC Layer
 * 
 * Uses list_auctions and place_auction_bid RPCs with input validation
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import { placeAuctionBidSchema, validateInput, type PlaceAuctionBidInput } from '@/lib/validation/schemas';
import type { Tables } from '@/integrations/supabase/types';

export type Auction = Tables<'auctions'>;
export type AuctionBid = Tables<'auction_bids'>;

/**
 * List all auctions
 */
export async function listAuctions() {
  return callRpc<Auction[]>('list_auctions');
}

/**
 * Get a single auction by ID
 */
export async function getAuctionById(auctionId: string) {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .maybeSingle();
  
  return { data, error };
}

/**
 * Get bids for an auction
 */
export async function getAuctionBids(auctionId: string) {
  const { data, error } = await supabase
    .from('auction_bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false });
  
  return { data, error };
}

/**
 * Place a bid on an auction with validated input
 */
export async function placeAuctionBid(params: PlaceAuctionBidInput) {
  // Validate input before sending to RPC
  const validated = validateInput(placeAuctionBidSchema, params);
  return callRpc<AuctionBid>('place_auction_bid', validated);
}
