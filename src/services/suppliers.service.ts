/**
 * Suppliers Service - Read operations for supplier data
 * 
 * NOTE: Supplier writes require backend RPC implementation.
 * @see ORCHESTRATION/API.openapiv1.yaml for pending RPC specs
 */

import { supabase } from '@/lib/supabase/rpc';
import { sanitizeSearchQuery } from '@/lib/validation/sanitize';
import type { Tables } from '@/integrations/supabase/types';

export type Supplier = Tables<'suppliers'>;
export type SupplierProfile = Tables<'supplier_profiles'>;
export type Product = Tables<'products'>;
export type Certification = Tables<'certifications'>;
export type Location = Tables<'locations'>;
export type Review = Tables<'reviews'>;

// Extended supplier type with related data
export interface SupplierWithDetails extends Supplier {
  products?: Product[];
  certifications?: Certification[];
  reviews?: Review[];
  locations?: Location[];
}

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
// ============================================

/**
 * Get all suppliers with optional filters
 * Queries the suppliers table directly using org_id as primary key
 */
export async function getSuppliers(options?: {
  verificationTier?: string;
  limit?: number;
}) {
  let query = supabase
    .from('suppliers')
    .select('*');
  
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
 * Get featured/verified suppliers for marketplace
 */
export async function getFeaturedSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .in('verification_tier', ['gold', 'silver'])
    .limit(5);
  
  return { data, error };
}

/**
 * Get supplier by org_id with full profile
 * Split into separate queries to avoid TS2589 deep type recursion
 */
export async function getSupplierById(supplierId: string) {
  const [supplierResult, productsResult, certificationsResult, reviewsResult, locationsResult] = await Promise.all([
    supabase.from('suppliers').select('*').eq('org_id', supplierId).single(),
    supabase.from('products').select('*').eq('supplier_id', supplierId),
    supabase.from('certifications').select('*').eq('supplier_id', supplierId),
    supabase.from('reviews').select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false }),
    supabase.from('locations').select('*').eq('supplier_id', supplierId),
  ]);

  const error = supplierResult.error || productsResult.error || certificationsResult.error || reviewsResult.error;
  
  if (error || !supplierResult.data) {
    return { data: null, error };
  }

  return {
    data: {
      ...supplierResult.data,
      products: productsResult.data || [],
      certifications: certificationsResult.data || [],
      reviews: reviewsResult.data || [],
      locations: locationsResult.data || [],
    } as SupplierWithDetails,
    error: null,
  };
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
 * Search suppliers by display name
 * Sanitizes input to prevent SQL injection and wildcard injection in LIKE patterns
 */
export async function searchSuppliers(query: string) {
  // Sanitize input with wildcard escape
  const sanitized = sanitizeSearchQuery(query);
  
  if (!sanitized) {
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .ilike('display_name', `%${sanitized}%`);
  
  return { data, error };
}
