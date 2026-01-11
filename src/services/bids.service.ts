/**
 * Bids Service - Lithium & Lux RPC Layer
 * 
 * Uses submit_bid and withdraw_bid RPCs with input validation.
 * All write operations require an authenticated Supabase client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { submitBidSchema, uuidSchema, validateInput, type SubmitBidInput } from '@/lib/validation/schemas';
import type { Tables, Database } from '@/integrations/supabase/types';

export type Bid = Tables<'bids'>;

/**
 * Get bids for the current org (direct read - RLS protected)
 */
export async function listBids() {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get bids for a specific RFQ (direct read - RLS protected)
 */
export async function getBidsByRfq(rfqId: string) {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('rfq_id', rfqId)
    .order('price', { ascending: true });
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Submit a new bid with validated input (authenticated)
 */
export async function submitBid(
  client: SupabaseClient<Database>,
  params: SubmitBidInput
): Promise<{ data: Bid | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(submitBidSchema, params);
  return callAuthenticatedRpc<Bid>(client, 'submit_bid', validated);
}

/**
 * Withdraw a bid (authenticated)
 */
export async function withdrawBid(
  client: SupabaseClient<Database>,
  bidId: string
): Promise<{ data: boolean | null; error: Error | null }> {
  // Validate UUID format
  validateInput(uuidSchema, bidId);
  return callAuthenticatedRpc<boolean>(client, 'withdraw_bid', { p_bid_id: bidId });
}
