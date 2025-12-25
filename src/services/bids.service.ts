/**
 * Bids Service - Lithium & Lux RPC Layer
 * 
 * Uses submit_bid and withdraw_bid RPCs with input validation
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import { submitBidSchema, uuidSchema, validateInput, type SubmitBidInput } from '@/lib/validation/schemas';
import type { Tables } from '@/integrations/supabase/types';

export type Bid = Tables<'bids'>;

/**
 * Get bids for the current org (direct read)
 */
export async function listBids() {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Get bids for a specific RFQ
 */
export async function getBidsByRfq(rfqId: string) {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('rfq_id', rfqId)
    .order('price', { ascending: true });
  
  return { data, error };
}

/**
 * Submit a new bid with validated input
 */
export async function submitBid(params: SubmitBidInput) {
  // Validate input before sending to RPC
  const validated = validateInput(submitBidSchema, params);
  return callRpc<Bid>('submit_bid', validated);
}

/**
 * Withdraw a bid
 */
export async function withdrawBid(bidId: string) {
  // Validate UUID format
  validateInput(uuidSchema, bidId);
  return callRpc<boolean>('withdraw_bid', { p_bid_id: bidId });
}
