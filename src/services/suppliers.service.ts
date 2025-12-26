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
  // Use public view for marketplace directory (safe columns only)
  let query = supabase
    .from('suppliers_public')
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
 * Get supplier by ID with full profile
 * Split into separate queries to avoid TS2589 deep type recursion
 */
export async function getSupplierById(supplierId: string) {
  const [supplierResult, productsResult, certificationsResult, reviewsResult] = await Promise.all([
    supabase.from('suppliers').select('*').eq('org_id', supplierId).single(),
    supabase.from('products').select('*').eq('supplier_id', supplierId),
    supabase.from('certifications').select('*').eq('supplier_id', supplierId),
    supabase.from('reviews').select('*').eq('supplier_id', supplierId),
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
    },
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
 * Search suppliers by name
 * Sanitizes input to prevent SQL injection in LIKE patterns
 */
export async function searchSuppliers(query: string) {
  // Validate input
  if (!query || typeof query !== 'string') {
    return { data: [], error: null };
  }
  
  // Sanitize: remove SQL special characters and limit length
  const sanitized = query
    .replace(/[%;'"\\]/g, '') // Remove SQL special chars
    .trim()
    .slice(0, 100); // Limit length
  
  if (sanitized.length < 2) {
    return { data: [], error: null };
  }
  
  // Use public view for marketplace search (safe columns only)
  const { data, error } = await supabase
    .from('suppliers_public')
    .select('*')
    .ilike('display_name', `%${sanitized}%`);
  
  return { data, error };
}
