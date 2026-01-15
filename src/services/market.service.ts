/**
 * Market Service - LithiumBuy RPC Layer
 * 
 * Uses get_price_indicators RPC
 */

import { callRpc } from '@/lib/supabase/rpc';

export interface PriceIndicator {
  symbol: string;
  region: string;
  price: number;
  currency: string;
  unit: string;
  observed_at: string;
  source: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Get price indicators
 */
export async function getPriceIndicators(params: {
  p_symbol: string;
  p_region: string;
  p_limit?: number;
}) {
  return callRpc<PriceIndicator[]>('get_price_indicators', params);
}
