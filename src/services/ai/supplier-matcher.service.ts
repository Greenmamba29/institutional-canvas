/**
 * Supplier Matcher Service - AI-assisted supplier recommendations for RFQs.
 *
 * The scorer is deterministic and tenant-data driven. It can be used with real
 * Supabase rows in production and with mock rows for demos/tests. AI layers may
 * explain or summarize the outcome, but the ranking inputs remain auditable.
 */

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
  commodity: string;
  quantity: number;
  delivery_location?: {
    lat: number;
    lon: number;
  };
  delivery_date?: string;
  max_price?: number;
}

export interface SupplierProductInput {
  name?: string | null;
  product_type?: string | null;
  min_order_quantity?: number | null;
  price_per_unit?: number | null;
}

export interface SupplierCertificationInput {
  certification_type?: string | null;
  expiry_date?: string | null;
}

export interface SupplierReviewInput {
  rating?: number | null;
}

export interface SupplierLocationInput {
  country?: string | null;
  coordinates?: unknown;
}

export interface SupplierMatchInput {
  supplier_id: string;
  supplier_name: string;
  supplier_logo?: string;
  verification_tier?: string | null;
  products?: SupplierProductInput[];
  certifications?: SupplierCertificationInput[];
  reviews?: SupplierReviewInput[];
  locations?: SupplierLocationInput[];
  past_deals_count?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalized(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasCommodityMatch(product: SupplierProductInput, commodity: string): boolean {
  const haystack = `${normalized(product.name)} ${normalized(product.product_type)}`;
  const needle = normalized(commodity);
  if (!needle) return false;
  return haystack.includes(needle) || needle.split(' ').every((term) => haystack.includes(term));
}

function extractCoordinates(coordinates: unknown): { lat: number; lon: number } | null {
  if (!coordinates || typeof coordinates !== 'object') return null;
  const record = coordinates as Record<string, unknown>;
  const lat = Number(record.lat ?? record.latitude);
  const lon = Number(record.lon ?? record.lng ?? record.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function averageRating(reviews: SupplierReviewInput[] = []): number {
  const ratings = reviews.map((review) => Number(review.rating)).filter(Number.isFinite);
  if (!ratings.length) return 0;
  return Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10;
}

function bestDistance(criteria: MatchCriteria, locations: SupplierLocationInput[] = []): number {
  if (!criteria.delivery_location) return 0;
  const distances = locations
    .map((location) => extractCoordinates(location.coordinates))
    .filter((coords): coords is { lat: number; lon: number } => Boolean(coords))
    .map((coords) => distanceKm(criteria.delivery_location!, coords));
  return distances.length ? Math.min(...distances) : 9999;
}

function actionForScore(score: number): SupplierMatch['recommended_action'] {
  if (score >= 70) return 'Request Quote';
  if (score >= 55) return 'Schedule Call';
  if (score >= 40) return 'Review Profile';
  return 'Pass';
}

export function scoreSupplierMatches(
  criteria: MatchCriteria,
  candidates: SupplierMatchInput[],
  limit = 10
): SupplierMatch[] {
  return candidates
    .map((candidate) => {
      const products = candidate.products ?? [];
      const matchingProducts = products.filter((product) => hasCommodityMatch(product, criteria.commodity));
      const bestProduct = matchingProducts[0];
      const reasoning: string[] = [];

      const product_match_score = bestProduct ? 40 : 0;
      reasoning.push(bestProduct ? `Offers ${criteria.commodity}` : 'No matching lithium product found');

      const capacity = bestProduct?.min_order_quantity ?? 0;
      const capacityRatio = criteria.quantity > 0 ? capacity / criteria.quantity : 0;
      const capacity_match_score = bestProduct
        ? capacityRatio >= 1
          ? 20
          : clamp(Math.round(capacityRatio * 20), 6, 18)
        : 0;
      if (bestProduct) {
        reasoning.push(capacityRatio >= 1 ? 'Capacity covers target quantity' : 'Capacity may require split award');
      }

      const dist = bestDistance(criteria, candidate.locations);
      const geographic_score = !criteria.delivery_location
        ? 10
        : dist <= 500
        ? 15
        : dist <= 1500
        ? 12
        : dist <= 4000
        ? 8
        : dist < 9999
        ? 5
        : 2;
      if (criteria.delivery_location) reasoning.push(dist < 9999 ? `${dist.toLocaleString()}km delivery distance` : 'Delivery coordinates missing');

      const certifications = candidate.certifications ?? [];
      const rating = averageRating(candidate.reviews);
      const tierBonus = candidate.verification_tier === 'gold' ? 4 : candidate.verification_tier === 'silver' ? 3 : candidate.verification_tier ? 2 : 0;
      const certificationBonus = clamp(certifications.length * 2, 0, 5);
      const ratingBonus = rating > 0 ? clamp(Math.round((rating / 5) * 4), 1, 4) : 0;
      const dealBonus = clamp(Math.round((candidate.past_deals_count ?? 0) / 3), 0, 2);
      const performance_score = clamp(tierBonus + certificationBonus + ratingBonus + dealBonus, 0, 15);
      if (certifications.length) reasoning.push(`${certifications.length} compliance certifications on file`);
      if (candidate.verification_tier) reasoning.push(`${candidate.verification_tier} verification tier`);
      if (rating) reasoning.push(`${rating.toFixed(1)} average rating`);

      const price = bestProduct?.price_per_unit ?? null;
      const price_score = price && criteria.max_price
        ? price <= criteria.max_price
          ? 10
          : clamp(10 - Math.ceil(((price - criteria.max_price) / criteria.max_price) * 20), 0, 8)
        : price
        ? 5
        : 3;
      if (price && criteria.max_price) reasoning.push(price <= criteria.max_price ? 'Within target price ceiling' : 'Above target price ceiling');

      const total_score = clamp(
        product_match_score + capacity_match_score + geographic_score + performance_score + price_score,
        0,
        100
      );

      return {
        supplier_id: candidate.supplier_id,
        supplier_name: candidate.supplier_name,
        supplier_logo: candidate.supplier_logo,
        total_score,
        product_match_score,
        capacity_match_score,
        geographic_score,
        performance_score,
        price_score,
        ranking: 0,
        reasoning,
        distance_km: dist,
        avg_rating: rating,
        past_deals_count: candidate.past_deals_count ?? 0,
        recommended_action: actionForScore(total_score),
      };
    })
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, limit)
    .map((match, index) => ({ ...match, ranking: index + 1 }));
}

/**
 * Find matching suppliers for an RFQ. If no live candidates are supplied, demo
 * matches are returned so the AI Studio remains useful in empty workspaces.
 */
export async function findSupplierMatches(
  criteria: MatchCriteria,
  limit: number = 10,
  candidates?: SupplierMatchInput[]
): Promise<{ matches: SupplierMatch[]; error?: Error }> {
  try {
    const matches = candidates?.length
      ? scoreSupplierMatches(criteria, candidates, limit)
      : getMockSupplierMatches(criteria.rfq_id).slice(0, limit);
    return { matches };
  } catch (error) {
    console.error('Error finding supplier matches:', error);
    return {
      matches: [],
      error: error instanceof Error ? error : new Error('Unknown error finding matches'),
    };
  }
}

/**
 * Get mock supplier matches for demos and empty-state fallbacks.
 */
export function getMockSupplierMatches(rfqId: string): SupplierMatch[] {
  return scoreSupplierMatches(
    {
      rfq_id: rfqId,
      commodity: 'Lithium Carbonate',
      quantity: 5000,
      delivery_location: { lat: 40, lon: -74 },
      max_price: 15000,
    },
    [
      {
        supplier_id: 'mock-1',
        supplier_name: 'GlobalLithium Solutions',
        verification_tier: 'gold',
        products: [{ name: 'Lithium Carbonate', product_type: 'Lithium Carbonate', min_order_quantity: 50000, price_per_unit: 14200 }],
        certifications: [{ certification_type: 'ISO 9001' }, { certification_type: 'ISO 14001' }, { certification_type: 'R2' }],
        reviews: [{ rating: 5 }, { rating: 4.2 }],
        locations: [{ country: 'US', coordinates: { lat: 42, lon: -73 } }],
        past_deals_count: 24,
      },
      {
        supplier_id: 'mock-2',
        supplier_name: 'AsiaMineral Corp',
        verification_tier: 'silver',
        products: [{ name: 'Lithium Carbonate', product_type: 'Lithium Carbonate', min_order_quantity: 30000, price_per_unit: 15000 }],
        certifications: [{ certification_type: 'ISO 9001' }, { certification_type: 'UN38.3' }],
        reviews: [{ rating: 4.4 }],
        locations: [{ country: 'KR', coordinates: { lat: 37.5, lon: 127 } }],
        past_deals_count: 18,
      },
      {
        supplier_id: 'mock-3',
        supplier_name: 'EuroLithium Group',
        verification_tier: 'bronze',
        products: [{ name: 'Lithium Carbonate', product_type: 'Lithium Carbonate', min_order_quantity: 20000, price_per_unit: 16900 }],
        certifications: [{ certification_type: 'ISO 14001' }],
        reviews: [{ rating: 4.1 }],
        locations: [{ country: 'DE', coordinates: { lat: 52.5, lon: 13.4 } }],
        past_deals_count: 12,
      },
      {
        supplier_id: 'mock-4',
        supplier_name: 'SouthAm Lithium SA',
        products: [{ name: 'Lithium Carbonate', product_type: 'Lithium Carbonate', min_order_quantity: 15000, price_per_unit: 14800 }],
        certifications: [],
        reviews: [{ rating: 3.9 }],
        locations: [{ country: 'CL', coordinates: { lat: -23.6, lon: -68.2 } }],
        past_deals_count: 6,
      },
    ]
  );
}
