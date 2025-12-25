/**
 * Purchases Service
 * 
 * Wraps all purchase order (PO) RPC calls with input validation.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Database } from '@/integrations/supabase/types';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { 
  uuidSchema, 
  currencySchema, 
  notesSchema, 
  nonNegativeNumberSchema,
  validateInput 
} from '@/lib/validation/schemas';

type Purchase = Database['public']['Tables']['purchases']['Row'];

// Validation schemas for purchase operations
const createPurchaseParamsSchema = z.object({
  buyerOrgId: uuidSchema,
  supplierOrgId: uuidSchema,
  dealId: uuidSchema.optional(),
  totalAmount: nonNegativeNumberSchema.optional(),
  currency: currencySchema.optional().default('USD'),
  notes: notesSchema.optional(),
  payload: z.record(z.unknown()).optional(),
});

const updatePurchaseStatusSchema = z.object({
  purchaseId: z.string().trim().min(1, 'Purchase ID is required').max(50, 'Purchase ID too long'),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled']),
});

const poNumberSchema = z.string().trim().min(1, 'PO number is required').max(50, 'PO number too long');

export type CreatePurchaseParams = z.infer<typeof createPurchaseParamsSchema>;
export type UpdatePurchaseStatusParams = z.infer<typeof updatePurchaseStatusSchema>;

/**
 * Create a new purchase order with validated input
 */
export async function createPurchase(
  client: SupabaseClient<Database>,
  params: CreatePurchaseParams
): Promise<{ data: Purchase | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(createPurchaseParamsSchema, params);
  
  return callAuthenticatedRpc<Purchase>(client, 'create_purchase', {
    p_buyer_org_id: validated.buyerOrgId,
    p_supplier_org_id: validated.supplierOrgId,
    p_deal_id: validated.dealId,
    p_total_amount: validated.totalAmount,
    p_currency: validated.currency || 'USD',
    p_notes: validated.notes,
    p_payload: validated.payload,
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
 * Get a single purchase by PO number with validated input
 */
export async function getPurchaseById(
  client: SupabaseClient<Database>,
  poNumber: string
): Promise<{ data: Purchase | null; error: Error | null }> {
  // Validate PO number
  const validated = validateInput(poNumberSchema, poNumber);
  
  return callAuthenticatedRpc<Purchase>(client, 'get_purchase_by_id', {
    p_po: validated,
  });
}

/**
 * Update purchase status with validated input
 */
export async function updatePurchaseStatus(
  client: SupabaseClient<Database>,
  params: UpdatePurchaseStatusParams
): Promise<{ data: Purchase | null; error: Error | null }> {
  // Validate input before sending to RPC
  const validated = validateInput(updatePurchaseStatusSchema, params);
  
  return callAuthenticatedRpc<Purchase>(client, 'update_purchase_status', {
    p_purchase_po: validated.purchaseId,
    p_status: validated.status,
  });
}
