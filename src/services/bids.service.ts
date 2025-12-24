/**
 * Bids Service - Lithium & Lux RPC Layer
 * 
 * Uses submit_bid and withdraw_bid RPCs
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
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
 * Submit a new bid
 */
export async function submitBid(params: {
  p_rfq_id: string;
  p_supplier_id: string;
  p_price: number;
  p_currency: string;
  p_quantity: number;
  p_lead_time_days: number;
  p_notes: string;
}) {
  return callRpc<Bid>('submit_bid', params);
}

/**
 * Withdraw a bid
 */
export async function withdrawBid(bidId: string) {
  return callRpc<boolean>('withdraw_bid', { p_bid_id: bidId });
}
