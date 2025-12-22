/**
 * Suppliers Service - Read operations for supplier data
 * 
 * NOTE: Supplier writes require backend RPC implementation.
 * @see ORCHESTRATION/API.openapiv1.yaml for pending RPC specs
 */

import { supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Supplier = Tables<'suppliers'>;
export type SupplierProfile = Tables<'supplier_profiles'>;
export type Product = Tables<'products'>;
export type Certification = Tables<'certifications'>;
export type Location = Tables<'locations'>;
export type Review = Tables<'reviews'>;

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
// ============================================

/**
 * Get all suppliers with optional filters
 */
export async function getSuppliers(options?: {
  verificationTier?: string;
  limit?: number;
}) {
  let query = supabase
    .from('suppliers')
    .select('*')
    .order('rating', { ascending: false });
  
  if (options?.verificationTier) {
    query = query.eq('verification_tier', options.verificationTier);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  return { data, error };
}

/**
 * Get supplier by ID with full profile
 */
export async function getSupplierById(supplierId: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      *,
      supplier_profiles (*),
      products (*),
      certifications (*),
      locations (*),
      reviews (*)
    `)
    .eq('id', supplierId)
    .single();
  
  return { data, error };
}

/**
 * Get products for a supplier
 */
export async function getSupplierProducts(supplierId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Get certifications for a supplier
 */
export async function getSupplierCertifications(supplierId: string) {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('supplier_id', supplierId);
  
  return { data, error };
}

/**
 * Get reviews for a supplier
 */
export async function getSupplierReviews(supplierId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Search suppliers by name
 */
export async function searchSuppliers(query: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('rating', { ascending: false });
  
  return { data, error };
}
