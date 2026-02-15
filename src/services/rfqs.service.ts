/**
 * RFQs Service - Lithium & Lux RPC Layer
 * 
 * Uses create_rfq and list_rfqs RPCs with input validation
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import { createRfqSchema, validateInput, type CreateRfqInput } from '@/lib/validation/schemas';
import type { Tables } from '@/integrations/supabase/types';

export type RFQ = Tables<'rfqs'>;

/**
 * List all RFQs for the current org
 */
export async function listRfqs() {
  return callRpc<RFQ[]>('list_rfqs');
}

/**
 * Create a new RFQ with validated input
 */
export async function createRfq(params: CreateRfqInput) {
  // Validate input before sending to RPC
  const validated = validateInput(createRfqSchema, params);
  return callRpc<RFQ>('create_rfq', validated);
}

/**
 * Get a single RFQ by ID (direct read)
 */
export async function getRfqById(rfqId: string) {
  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', rfqId)
    .maybeSingle();
  
  return { data, error };
}
