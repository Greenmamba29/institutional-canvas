/**
 * RFQs Service - Lithium & Lux RPC Layer
 * 
 * Uses create_rfq and list_rfqs RPCs
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type RFQ = Tables<'rfqs'>;

/**
 * List all RFQs for the current org
 */
export async function listRfqs() {
  return callRpc<RFQ[]>('list_rfqs');
}

/**
 * Create a new RFQ
 */
export async function createRfq(params: {
  p_title: string;
  p_description: string;
  p_product_id: string;
  p_target_quantity: number;
  p_target_unit: string;
  p_incoterms: string;
  p_delivery_location: string;
}) {
  return callRpc<RFQ>('create_rfq', params);
}

/**
 * Get a single RFQ by ID (direct read)
 */
export async function getRfqById(rfqId: string) {
  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', rfqId)
    .single();
  
  return { data, error };
}
