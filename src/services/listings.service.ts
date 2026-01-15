/**
 * Listings Service - LithiumBuy RPC Layer
 * 
 * Uses list_listings and get_listing RPCs
 */

import { callRpc } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;

/**
 * List all product listings
 */
export async function listListings() {
  return callRpc<Product[]>('list_listings');
}

/**
 * Get a single listing by product ID
 */
export async function getListing(productId: string) {
  return callRpc<Product>('get_listing', { p_product_id: productId });
}
