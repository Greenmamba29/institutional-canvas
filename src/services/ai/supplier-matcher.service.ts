/**
 * Supplier Matcher Service - AI-powered supplier recommendations for RFQs
 * Uses mock data for demo - in production would use ML ranking algorithms
 * 
 * Scoring Algorithm:
 * - Product Match: 40 points (commodity type, grade, specifications)
 * - Capacity Match: 20 points (volume, delivery timeline)
 * - Geographic Score: 15 points (proximity to delivery location)
 * - Performance Score: 15 points (ratings, past deals, reliability)
 * - Price Score: 10 points (competitive pricing)
 * 
 * Total: 100 points
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

/**
 * Find matching suppliers for an RFQ
 * Uses mock data for demo
 */
export async function findSupplierMatches(
  criteria: MatchCriteria,
  limit: number = 10
): Promise<{ matches: SupplierMatch[]; error?: Error }> {
  try {
    // For demo, return mock matches
    const matches = getMockSupplierMatches(criteria.rfq_id);
    return { matches: matches.slice(0, limit) };
  } catch (error) {
    console.error('Error finding supplier matches:', error);
    return {
      matches: [],
      error: error instanceof Error ? error : new Error('Unknown error finding matches'),
    };
  }
}

/**
 * Get mock supplier matches for testing
 */
export function getMockSupplierMatches(rfqId: string): SupplierMatch[] {
  return [
    {
      supplier_id: 'mock-1',
      supplier_name: 'GlobalLithium Solutions',
      total_score: 87,
      product_match_score: 38,
      capacity_match_score: 18,
      geographic_score: 12,
      performance_score: 13,
      price_score: 6,
      ranking: 1,
      reasoning: [
        'Offers Lithium Carbonate',
        '3 industry certifications',
        'Verified supplier',
        'Capacity: 50,000t/year (excellent)',
        'Lead time: 25 days',
        '850km away (regional)',
        '4.6⭐ average rating',
        '24 completed deals (experienced)',
        'Transparent pricing history',
      ],
      distance_km: 850,
      avg_rating: 4.6,
      past_deals_count: 24,
      recommended_action: 'Request Quote',
    },
    {
      supplier_id: 'mock-2',
      supplier_name: 'AsiaMineral Corp',
      total_score: 76,
      product_match_score: 35,
      capacity_match_score: 15,
      geographic_score: 8,
      performance_score: 12,
      price_score: 6,
      ranking: 2,
      reasoning: [
        'Offers Lithium Carbonate',
        '2 industry certifications',
        'Verified supplier',
        'Capacity: 30,000t/year (good)',
        'Lead time: 35 days (moderate)',
        '3,200km away (continental)',
        '4.4⭐ average rating',
        '18 completed deals',
        'Target price: $15,000/t',
      ],
      distance_km: 3200,
      avg_rating: 4.4,
      past_deals_count: 18,
      recommended_action: 'Request Quote',
    },
    {
      supplier_id: 'mock-3',
      supplier_name: 'EuroLithium Group',
      total_score: 68,
      product_match_score: 30,
      capacity_match_score: 12,
      geographic_score: 15,
      performance_score: 8,
      price_score: 3,
      ranking: 3,
      reasoning: [
        'Offers Lithium Carbonate',
        '1 industry certifications',
        'Trusted supplier',
        'Capacity: 20,000t/year (adequate)',
        '450km away (local)',
        '4.1⭐ average rating',
        '12 completed deals',
        'No price benchmark available',
      ],
      distance_km: 450,
      avg_rating: 4.1,
      past_deals_count: 12,
      recommended_action: 'Schedule Call',
    },
    {
      supplier_id: 'mock-4',
      supplier_name: 'SouthAm Lithium SA',
      total_score: 54,
      product_match_score: 25,
      capacity_match_score: 10,
      geographic_score: 6,
      performance_score: 8,
      price_score: 5,
      ranking: 4,
      reasoning: [
        'Offers Lithium Carbonate',
        'Basic verification only',
        'Capacity: 15,000t/year (adequate)',
        '8,500km away (international)',
        '3.9⭐ average rating',
        '6 completed deals',
        'Competitive pricing',
      ],
      distance_km: 8500,
      avg_rating: 3.9,
      past_deals_count: 6,
      recommended_action: 'Review Profile',
    },
  ];
}
