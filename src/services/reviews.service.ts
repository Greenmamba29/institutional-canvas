/**
 * Reviews Service - RPC wrappers for review operations
 * 
 * Uses create_review and increment_review_helpful RPCs for writes
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Review = Tables<'reviews'>;

export interface CreateReviewParams {
  supplierId: string;
  rating: number;
  content: string;
  author: string;
  company?: string;
  verifiedPurchase?: boolean;
}

/**
 * Create a new review via RPC
 */
export async function createReview(params: CreateReviewParams) {
  return callRpc<Review>('create_review', {
    p_supplier_id: params.supplierId,
    p_rating: params.rating,
    p_content: params.content,
    p_author: params.author,
    p_company: params.company || null,
    p_verified_purchase: params.verifiedPurchase || false,
  });
}

/**
 * Increment helpful count for a review via RPC
 */
export async function incrementReviewHelpful(reviewId: string) {
  return callRpc<Review>('increment_review_helpful', {
    p_review_id: reviewId,
  });
}

/**
 * Get reviews for a supplier (read-only)
 */
export async function getSupplierReviews(supplierId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}
