/**
 * Deals Service - LithiumBuy RPC Layer
 * 
 * Uses create_deal, update_deal_status, respond_to_offer RPCs with input validation.
 * All write operations require an authenticated Supabase client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { 
  createDealSchema, 
  respondToOfferSchema, 
  uuidSchema, 
  validateInput, 
  type CreateDealInput,
  type RespondToOfferInput
} from '@/lib/validation/schemas';
import type { Tables, Enums, Database } from '@/integrations/supabase/types';

export type Deal = Tables<'deals'>;
export type DealStatus = Enums<'deal_status'>;
export type OfferDecision = Enums<'offer_decision'>;

/**
 * List all deals for the current org (direct read - RLS protected)
 */
export async function listDeals() {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get a single deal by ID (direct read - RLS protected)
 */
export async function getDealById(dealId: string) {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Create a new deal with validated input (authenticated)
 */
export async function createDeal(
  client: SupabaseClient<Database>,
  params: CreateDealInput
): Promise<{ data: Deal | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(createDealSchema, params);
  return callAuthenticatedRpc<Deal>(client, 'create_deal', validated);
}

/**
 * Update deal status (authenticated)
 */
export async function updateDealStatus(
  client: SupabaseClient<Database>,
  params: {
    p_deal_id: string;
    p_status: DealStatus;
  }
): Promise<{ data: Deal | null; error: Error | null }> {
  // Validate UUID
  validateInput(uuidSchema, params.p_deal_id);
  return callAuthenticatedRpc<Deal>(client, 'update_deal_status', params);
}

/**
 * Respond to an offer (accept/reject/counter) with validated input (authenticated)
 */
export async function respondToOffer(
  client: SupabaseClient<Database>,
  params: RespondToOfferInput
): Promise<{ data: Deal | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(respondToOfferSchema, params);
  return callAuthenticatedRpc<Deal>(client, 'respond_to_offer', validated);
}
