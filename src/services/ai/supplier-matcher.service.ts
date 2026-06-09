/**
 * Supplier Matcher Service - rule-based supplier recommendations for RFQs
 *
 * DETERMINISTIC, transparent scoring over REAL Supabase data (no LLM, no mocks).
 * Source data:
 *   suppliers.capabilities  -> { products: string[], capacity_mt: number }
 *   suppliers.public_profile-> { headquarters: string, founded, description }
 *   suppliers.verification_tier ('gold' | 'silver' | 'standard' | ...)
 *   suppliers.claim_status
 *   rfqs.product_type / purity_grade / title / target_quantity / target_unit
 *   rfqs.delivery_location / incoterms
 *
 * Scoring (max 100):
 * - Product Match:  40  (rfq product type/grade/title tokens vs supplier capabilities.products)
 * - Capacity Match: 20  (supplier capabilities.capacity_mt vs rfq.target_quantity)
 * - Geographic:     15  (supplier HQ region vs rfq delivery_location region)
 * - Performance:    15  (verification_tier + claim_status)
 * - Price:          10  (supplier price vs rfq target/market — degrades to neutral when absent)
 *
 * Every sub-score is defensive: missing jsonb keys yield a partial/neutral score,
 * never a crash.
 */

import { getSuppliers, type Supplier } from '@/services/suppliers.service';
import { getRfqById } from '@/services/rfqs.service';

export interface SupplierMatch {
  supplier_id: string;
  supplier_name: string;
  supplier_logo?: string;
  total_score: number;
  product_match_score: number;
  capacity_match_score: number;
  geographic_score: number;
  performance_score: number;
  price_score: number;
  ranking: number;
  reasoning: string[];
  distance_km: number;
  avg_rating: number;
  past_deals_count: number;
  recommended_action: 'Request Quote' | 'Schedule Call' | 'Review Profile' | 'Pass';
}

export interface MatchCriteria {
  rfq_id: string;
  commodity?: string;
  quantity?: number;
  delivery_location?: string;
  delivery_date?: string;
  max_price?: number;
}

// ---- jsonb shapes (defensive; all keys optional) ----
interface SupplierCapabilities {
  products?: string[];
  capacity_mt?: number;
  price_per_mt?: number; // not present in current data; supported if added later
}
interface SupplierPublicProfile {
  headquarters?: string;
  rating?: number; // not present in current data; supported if added later
}

/** Normalize a free-text product label to comparable tokens, e.g. "Lithium Carbonate" -> ["lithium","carbonate"]. */
function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 2); // drop noise like "of", "mt"
}

/** Coerce a value that may be a string ("2000") or number into a finite number, else undefined. */
function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * PRODUCT MATCH — up to 40.
 * Compares RFQ product tokens (from product_type, purity_grade, and the title as a
 * fallback because product_type is frequently null in real data) against the
 * supplier's capabilities.products list. Score is proportional to token overlap.
 */
function scoreProduct(
  rfqTokens: string[],
  products: string[],
  reasoning: string[]
): number {
  const MAX = 40;
  if (products.length === 0) {
    reasoning.push('No product capabilities listed');
    return 0;
  }
  if (rfqTokens.length === 0) {
    // RFQ gives no product signal -> can't reward or penalize; give neutral half.
    reasoning.push('RFQ product unspecified — neutral product match');
    return MAX / 2;
  }

  const supplierTokens = new Set(products.flatMap((p) => tokenize(p)));
  const matched = rfqTokens.filter((t) => supplierTokens.has(t));
  const ratio = matched.length / rfqTokens.length;
  const score = Math.round(ratio * MAX);

  if (ratio >= 1) reasoning.push(`Exact product match (${products.join(', ')})`);
  else if (ratio > 0) reasoning.push(`Partial product match (${products.join(', ')})`);
  else reasoning.push(`Offers ${products.join(', ')} (different from request)`);

  return score;
}

/**
 * CAPACITY MATCH — up to 20.
 * Supplier annual capacity (capabilities.capacity_mt) vs RFQ target_quantity.
 * Ample capacity (>= 10x demand) is full marks; scales down toward demand parity.
 */
function scoreCapacity(
  capacityMt: number | undefined,
  targetQty: number | undefined,
  reasoning: string[]
): number {
  const MAX = 20;
  if (capacityMt === undefined) {
    reasoning.push('Capacity not stated');
    return 0;
  }
  if (!targetQty) {
    // No demand figure -> reward having a stated capacity at neutral half.
    reasoning.push(`Capacity: ${capacityMt.toLocaleString()} MT/yr`);
    return MAX / 2;
  }
  const ratio = capacityMt / targetQty;
  let score: number;
  if (ratio >= 10) score = MAX;
  else if (ratio >= 1) score = Math.round(MAX * (0.5 + 0.5 * ((ratio - 1) / 9)));
  else score = Math.round(MAX * ratio * 0.5); // below demand: capped, scales with coverage

  if (ratio >= 10) reasoning.push(`Capacity ${capacityMt.toLocaleString()} MT/yr (ample)`);
  else if (ratio >= 1) reasoning.push(`Capacity ${capacityMt.toLocaleString()} MT/yr (sufficient)`);
  else reasoning.push(`Capacity ${capacityMt.toLocaleString()} MT/yr (below requested volume)`);

  return score;
}

/**
 * GEOGRAPHIC — up to 15.
 * No coordinates exist in the data, so we do a transparent region/country token
 * overlap between the supplier HQ and the RFQ delivery_location.
 */
function scoreGeographic(
  headquarters: string | undefined,
  deliveryLocation: string | null | undefined,
  reasoning: string[]
): { score: number; hqLabel: string } {
  const MAX = 15;
  const hqLabel = headquarters || 'Unknown location';
  if (!headquarters || !deliveryLocation) {
    reasoning.push('Location data incomplete — neutral geographic score');
    return { score: Math.round(MAX / 2), hqLabel };
  }
  const hqTokens = new Set(tokenize(headquarters));
  const destTokens = tokenize(deliveryLocation);
  const overlap = destTokens.some((t) => hqTokens.has(t));
  if (overlap) {
    reasoning.push(`HQ (${headquarters}) in delivery region`);
    return { score: MAX, hqLabel };
  }
  reasoning.push(`HQ ${headquarters} (outside delivery region)`);
  return { score: Math.round(MAX * 0.4), hqLabel };
}

/**
 * PERFORMANCE — up to 15.
 * Verification tier is the strongest real signal (gold > silver > standard),
 * plus a small bonus if the org has claimed/verified its profile, and any
 * explicit rating in public_profile if present.
 */
function scorePerformance(
  tier: string | null | undefined,
  claimStatus: string | null | undefined,
  rating: number | undefined,
  reasoning: string[]
): number {
  const MAX = 15;
  const tierPoints: Record<string, number> = {
    gold: 10,
    silver: 7,
    standard: 4,
    bronze: 4,
  };
  const t = (tier || '').toLowerCase();
  let score = tierPoints[t] ?? 2; // unknown/unverified tier -> minimal credit
  reasoning.push(tier ? `${t} verified supplier` : 'Unverified supplier');

  if (claimStatus && claimStatus.toLowerCase() === 'claimed') {
    score += 2;
    reasoning.push('Profile claimed');
  }
  if (rating !== undefined && Number.isFinite(rating)) {
    score += Math.round((rating / 5) * 3); // up to +3 for a 5-star rating
    reasoning.push(`${rating.toFixed(1)}/5 rating`);
  }
  return Math.min(score, MAX);
}

/**
 * PRICE — up to 10.
 * Real data currently carries no supplier price or RFQ target price, so this
 * degrades to a neutral score. When capabilities.price_per_mt and an RFQ/market
 * reference exist, lower price scores higher.
 */
function scorePrice(
  supplierPrice: number | undefined,
  referencePrice: number | undefined,
  reasoning: string[]
): number {
  const MAX = 10;
  if (supplierPrice === undefined || referencePrice === undefined || referencePrice <= 0) {
    reasoning.push('No price benchmark available');
    return Math.round(MAX / 2); // neutral
  }
  const ratio = supplierPrice / referencePrice; // <1 means cheaper than reference
  let score: number;
  if (ratio <= 0.8) score = MAX;
  else if (ratio <= 1) score = Math.round(MAX * (1 - (ratio - 0.8) * 2.5)); // 0.8->10, 1.0->5
  else score = Math.max(0, Math.round(MAX * (1 - (ratio - 1)))); // over reference: drops off
  reasoning.push(
    ratio <= 1 ? `Competitive price ($${supplierPrice}/MT)` : `Above-market price ($${supplierPrice}/MT)`
  );
  return score;
}

function recommendedAction(total: number): SupplierMatch['recommended_action'] {
  if (total >= 75) return 'Request Quote';
  if (total >= 55) return 'Schedule Call';
  if (total >= 35) return 'Review Profile';
  return 'Pass';
}

/**
 * Find matching suppliers for an RFQ using REAL data.
 * Fetches the RFQ by id + all suppliers, computes the 5 transparent sub-scores,
 * and returns the top matches sorted by total_score desc.
 */
export async function findSupplierMatches(
  criteria: MatchCriteria,
  limit: number = 10
): Promise<{ matches: SupplierMatch[]; error?: Error }> {
  try {
    const [{ data: rfq, error: rfqError }, { data: suppliers, error: supError }] = await Promise.all([
      getRfqById(criteria.rfq_id),
      getSuppliers(),
    ]);

    if (rfqError) return { matches: [], error: rfqError };
    if (supError) return { matches: [], error: supError as Error };
    if (!rfq) return { matches: [], error: new Error('RFQ not found') };

    // RFQ product signal: product_type + purity_grade, falling back to the title
    // (real RFQs frequently leave product_type null but name the product in the title).
    const rfqProductTokens = Array.from(
      new Set([
        ...tokenize(rfq.product_type),
        ...tokenize(rfq.purity_grade),
        ...(rfq.product_type ? [] : tokenize(rfq.title)),
      ])
    );
    const targetQty = toNumber(rfq.target_quantity) ?? criteria.quantity;
    const referencePrice = criteria.max_price; // RFQ has no price column today

    const matches: SupplierMatch[] = (suppliers ?? []).map((supplier: Supplier) => {
      const capabilities = (supplier.capabilities ?? {}) as SupplierCapabilities;
      const profile = (supplier.public_profile ?? {}) as SupplierPublicProfile;
      const reasoning: string[] = [];

      const product_match_score = scoreProduct(rfqProductTokens, capabilities.products ?? [], reasoning);
      const capacity_match_score = scoreCapacity(toNumber(capabilities.capacity_mt), targetQty, reasoning);
      const { score: geographic_score } = scoreGeographic(profile.headquarters, rfq.delivery_location, reasoning);
      const performance_score = scorePerformance(
        supplier.verification_tier,
        supplier.claim_status,
        toNumber(profile.rating),
        reasoning
      );
      const price_score = scorePrice(toNumber(capabilities.price_per_mt), referencePrice, reasoning);

      const total_score =
        product_match_score + capacity_match_score + geographic_score + performance_score + price_score;

      return {
        supplier_id: supplier.org_id,
        supplier_name: supplier.display_name ?? 'Unknown supplier',
        total_score,
        product_match_score,
        capacity_match_score,
        geographic_score,
        performance_score,
        price_score,
        ranking: 0, // assigned after sort
        reasoning,
        distance_km: 0, // no coordinates in real data
        avg_rating: toNumber(profile.rating) ?? 0,
        past_deals_count: 0, // not tracked in current schema
        recommended_action: recommendedAction(total_score),
      };
    });

    matches.sort((a, b) => b.total_score - a.total_score);
    matches.forEach((m, i) => {
      m.ranking = i + 1;
    });

    return { matches: matches.slice(0, limit) };
  } catch (error) {
    console.error('Error finding supplier matches:', error);
    return {
      matches: [],
      error: error instanceof Error ? error : new Error('Unknown error finding matches'),
    };
  }
}
