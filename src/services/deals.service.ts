/**
 * Deals Service - Lithium & Lux RPC Layer
 * 
 * Uses create_deal, update_deal_status, respond_to_offer RPCs with input validation
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import { 
  createDealSchema, 
  respondToOfferSchema, 
  uuidSchema, 
  validateInput, 
  type CreateDealInput,
  type RespondToOfferInput
} from '@/lib/validation/schemas';
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
 * Create a new deal with validated input
 */
export async function createDeal(params: CreateDealInput) {
  // Validate input before sending to RPC
  const validated = validateInput(createDealSchema, params);
  return callRpc<Deal>('create_deal', validated);
}

/**
 * Update deal status
 */
export async function updateDealStatus(params: {
  p_deal_id: string;
  p_status: DealStatus;
}) {
  // Validate UUID
  validateInput(uuidSchema, params.p_deal_id);
  return callRpc<Deal>('update_deal_status', params);
}

/**
 * Respond to an offer (accept/reject/counter) with validated input
 */
export async function respondToOffer(params: RespondToOfferInput) {
  // Validate input before sending to RPC
  const validated = validateInput(respondToOfferSchema, params);
  return callRpc<Deal>('respond_to_offer', validated);
}
