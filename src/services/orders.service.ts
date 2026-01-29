/**
 * Orders Service - CRUD operations for orders and quotes
 *
 * Uses Supabase RPC for secure mutations with proper authorization.
 */

import { supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Order = Tables<'orders'>;
export type Quote = Tables<'quotes'>;

// ============================================
// ORDER MUTATIONS (via RPC)
// ============================================

export interface CreateOrderParams {
  quoteId?: string;
  supplierId: string;
  totalAmount: number;
  currency?: string;
  orgId?: string;
}

/**
 * Create a new order
 */
export async function createOrder(params: CreateOrderParams): Promise<{ data: Order | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('create_order', {
    p_supplier_id: params.supplierId,
    p_total_amount: params.totalAmount,
    p_currency: params.currency || 'USD',
    p_quote_id: params.quoteId || null,
    p_org_id: params.orgId || null,
  });

  if (error) {
    console.error('[orders.service] create_order failed:', error.message);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Order, error: null };
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  paymentStatus?: string
): Promise<{ data: Order | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_payment_status: paymentStatus || null,
  });

  if (error) {
    console.error('[orders.service] update_order_status failed:', error.message);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Order, error: null };
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
