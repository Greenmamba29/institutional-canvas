/**
 * Quotes Service - RPC wrappers for quote operations
 * 
 * Uses create_quote RPC for writes, direct reads for queries
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Quote = Tables<'quotes'>;

export interface CreateQuoteParams {
  supplierId: string;
  productId?: string;
  quantity: number;
  requestedPrice?: number;
  expiresAt?: string;
  notes?: string;
}

/**
 * Create a new quote request via RPC
 */
export async function createQuote(params: CreateQuoteParams) {
  return callRpc<Quote>('create_quote', {
    p_supplier_id: params.supplierId,
    p_product_id: params.productId || null,
    p_quantity: params.quantity,
    p_requested_price: params.requestedPrice || null,
    p_expires_at: params.expiresAt || null,
    p_notes: params.notes || null,
  });
}

/**
 * Get quotes for current user (read-only)
 */
export async function getQuotes(options?: { status?: string; limit?: number }) {
  let query = supabase.from('quotes').select('*, products(name, price_per_unit, currency)');
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}
