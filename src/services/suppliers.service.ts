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

export type SupplierMatchCandidate = SupplierWithDetails;

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

/**
 * Get supplier candidates with products, certifications, reviews, and locations
 * for deterministic RFQ matching. Split queries avoid deeply recursive Supabase
 * relation types and keep each read RLS-protected.
 */
export async function getSupplierMatchCandidates(options?: { limit?: number }) {
  const { data: suppliers, error: supplierError } = await getSuppliers({ limit: options?.limit ?? 50 });
  if (supplierError || !suppliers?.length) {
    return { data: suppliers ? [] : null, error: supplierError };
  }

  const supplierIds = suppliers.map((supplier) => supplier.org_id);
  const [productsResult, certificationsResult, reviewsResult, locationsResult] = await Promise.all([
    supabase.from('products').select('*').in('supplier_id', supplierIds),
    supabase.from('certifications').select('*').in('supplier_id', supplierIds),
    supabase.from('reviews').select('*').in('supplier_id', supplierIds),
    supabase.from('locations').select('*').in('supplier_id', supplierIds),
  ]);

  const error = productsResult.error || certificationsResult.error || reviewsResult.error || locationsResult.error;
  if (error) return { data: null, error };

  const bySupplier = <T extends { supplier_id: string }>(rows: T[] | null) => {
    const grouped = new Map<string, T[]>();
    (rows ?? []).forEach((row) => {
      grouped.set(row.supplier_id, [...(grouped.get(row.supplier_id) ?? []), row]);
    });
    return grouped;
  };

  const productsBySupplier = bySupplier(productsResult.data);
  const certificationsBySupplier = bySupplier(certificationsResult.data);
  const reviewsBySupplier = bySupplier(reviewsResult.data);
  const locationsBySupplier = bySupplier(locationsResult.data);

  const candidates: SupplierMatchCandidate[] = suppliers.map((supplier) => ({
    ...supplier,
    products: productsBySupplier.get(supplier.org_id) ?? [],
    certifications: certificationsBySupplier.get(supplier.org_id) ?? [],
    reviews: reviewsBySupplier.get(supplier.org_id) ?? [],
    locations: locationsBySupplier.get(supplier.org_id) ?? [],
  }));

  return { data: candidates, error: null };
}
