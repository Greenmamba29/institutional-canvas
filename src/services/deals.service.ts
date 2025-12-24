/**
 * Deals Service - Lithium & Lux RPC Layer
 * 
 * Uses create_deal, update_deal_status, respond_to_offer RPCs
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables, Enums } from '@/integrations/supabase/types';

export type Deal = Tables<'deals'>;
export type DealStatus = Enums<'deal_status'>;
export type OfferDecision = Enums<'offer_decision'>;

/**
 * List all deals for the current org (direct read)
 */
export async function listDeals() {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Get a single deal by ID
 */
export async function getDealById(dealId: string) {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();
  
  return { data, error };
}

/**
 * Create a new deal
 */
export async function createDeal(params: {
  p_supplier_id: string;
  p_rfq_id: string;
  p_title: string;
}) {
  return callRpc<Deal>('create_deal', params);
}

/**
 * Update deal status
 */
export async function updateDealStatus(params: {
  p_deal_id: string;
  p_status: DealStatus;
}) {
  return callRpc<Deal>('update_deal_status', params);
}

/**
 * Respond to an offer (accept/reject/counter)
 */
export async function respondToOffer(params: {
  p_deal_id: string;
  p_decision: OfferDecision;
  p_note: string;
}) {
  return callRpc<Deal>('respond_to_offer', params);
}
