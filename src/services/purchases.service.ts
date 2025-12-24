/**
 * Purchases Service
 * 
 * Wraps all purchase order (PO) RPC calls.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';

type Purchase = Database['public']['Tables']['purchases']['Row'];

export interface CreatePurchaseParams {
  buyerOrgId: string;
  supplierOrgId: string;
  dealId?: string;
  totalAmount?: number;
  currency?: string;
  notes?: string;
  payload?: Record<string, unknown>;
}

export interface UpdatePurchaseStatusParams {
  purchaseId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
}

/**
 * Create a new purchase order
 */
export async function createPurchase(
  client: SupabaseClient<Database>,
  params: CreatePurchaseParams
): Promise<{ data: Purchase | null; error: Error | null }> {
  return callAuthenticatedRpc<Purchase>(client, 'create_purchase', {
    p_buyer_org_id: params.buyerOrgId,
    p_supplier_org_id: params.supplierOrgId,
    p_deal_id: params.dealId,
    p_total_amount: params.totalAmount,
    p_currency: params.currency || 'USD',
    p_notes: params.notes,
    p_payload: params.payload,
  });
}

/**
 * List all purchases for the current user's organizations
 */
export async function listPurchases(
  client: SupabaseClient<Database>
): Promise<{ data: Purchase[] | null; error: Error | null }> {
  return callAuthenticatedRpc<Purchase[]>(client, 'list_purchases');
}

/**
 * Get a single purchase by PO number
 */
export async function getPurchaseById(
  client: SupabaseClient<Database>,
  poNumber: string
): Promise<{ data: Purchase | null; error: Error | null }> {
  return callAuthenticatedRpc<Purchase>(client, 'get_purchase_by_id', {
    p_po: poNumber,
  });
}

/**
 * Update purchase status
 */
export async function updatePurchaseStatus(
  client: SupabaseClient<Database>,
  params: UpdatePurchaseStatusParams
): Promise<{ data: Purchase | null; error: Error | null }> {
  return callAuthenticatedRpc<Purchase>(client, 'update_purchase_status', {
    p_purchase_po: params.purchaseId,
    p_status: params.status,
  });
}
