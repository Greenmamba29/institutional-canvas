/**
 * RFQs Service - Lithium & Lux RPC Layer
 * 
 * Uses create_rfq and list_rfqs RPCs with input validation.
 * All write operations require an authenticated Supabase client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { createRfqSchema, validateInput, type CreateRfqInput } from '@/lib/validation/schemas';
import type { Tables, Database } from '@/integrations/supabase/types';

export type RFQ = Tables<'rfqs'>;

/**
 * List all RFQs for the current org (authenticated)
 */
export async function listRfqs(
  client: SupabaseClient<Database>
): Promise<{ data: RFQ[] | null; error: Error | null }> {
  return callAuthenticatedRpc<RFQ[]>(client, 'list_rfqs');
}

/**
 * Create a new RFQ with validated input (authenticated)
 */
export async function createRfq(
  client: SupabaseClient<Database>,
  params: CreateRfqInput
): Promise<{ data: RFQ | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(createRfqSchema, params);
  return callAuthenticatedRpc<RFQ>(client, 'create_rfq', validated);
}

/**
 * Get a single RFQ by ID (direct read - RLS protected)
 */
export async function getRfqById(rfqId: string) {
  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', rfqId)
    .single();
  
  return { data, error: error ? new Error(error.message) : null };
}
