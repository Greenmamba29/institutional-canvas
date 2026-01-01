/**
 * Orders Service - Read operations for orders and quotes
 * 
 * NOTE: Order/Quote writes require backend RPC implementation.
 * @see ORCHESTRATION/API.openapiv1.yaml - create_order, update_order_status
 */

import { supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Order = Tables<'orders'>;
export type Quote = Tables<'quotes'>;

// ============================================
// PENDING RPC IMPLEMENTATIONS
// These functions are stubs - backend must implement the RPCs
// ============================================

/**
 * Create a new order (PENDING BACKEND IMPLEMENTATION)
 * @see ORCHESTRATION/API.openapiv1.yaml - POST /rpc/create_order
 */
export async function createOrder(_params: {
  quoteId?: string;
  supplierId: string;
  totalAmount: number;
  currency?: string;
}): Promise<{ data: null; error: Error }> {
  // TODO: Replace with rpc('create_order', params) when backend implements
  console.warn('[orders.service] create_order RPC not yet implemented');
  return { data: null, error: new Error('RPC create_order not implemented - request backend implementation') };
}

/**
 * Update order status (PENDING BACKEND IMPLEMENTATION)
 * @see ORCHESTRATION/API.openapiv1.yaml - POST /rpc/update_order_status
 */
export async function updateOrderStatus(_orderId: string, _status: string): Promise<{ data: null; error: Error }> {
  // TODO: Replace with rpc('update_order_status', { p_order_id, p_status }) when backend implements
  console.warn('[orders.service] update_order_status RPC not yet implemented');
  return { data: null, error: new Error('RPC update_order_status not implemented - request backend implementation') };
}

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
// ============================================

/**
 * Get orders for current user
 */
export async function getOrders(options?: { status?: string; limit?: number }) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      quotes (*)
    `)
    .order('created_at', { ascending: false });
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  return { data, error };
}

/**
 * Get order by ID with full details
 */
export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      quotes (*, products (*))
    `)
    .eq('id', orderId)
    .single();
  
  return { data, error };
}

/**
 * Get quotes for current user
 */
export async function getQuotes(options?: { status?: string; limit?: number }) {
  let query = supabase
    .from('quotes')
    .select(`
      *,
      products (name, product_type, purity_level)
    `)
    .order('created_at', { ascending: false });
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  return { data, error };
}

/**
 * Get quote by ID
 */
export async function getQuoteById(quoteId: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      products (*)
    `)
    .eq('id', quoteId)
    .single();
  
  return { data, error };
}
