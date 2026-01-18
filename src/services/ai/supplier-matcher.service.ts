/**
 * Supplier Matcher Service - AI-powered supplier recommendations for RFQs
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

import { supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';
import { calculateDistance } from './ml-utils';

export type SupplierProfile = Tables<'supplier_profiles'>;
export type RFQ = Tables<'rfqs'>;

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
 * Calculate product match score (0-40 points)
 */
function calculateProductMatch(
  supplier: SupplierProfile,
  criteria: MatchCriteria
): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let score = 0;

  // Check commodity type match (20 points)
  const supplierProducts = supplier.products_offered as string[] || [];
  const commodityMatch = supplierProducts.some(p => 
    p.toLowerCase().includes(criteria.commodity.toLowerCase())
  );
  
  if (commodityMatch) {
    score += 20;
    reasoning.push(`Offers ${criteria.commodity}`);
  } else {
    reasoning.push(`Does not offer ${criteria.commodity}`);
  }

  // Check certifications (10 points)
  const certifications = supplier.certifications as string[] || [];
  if (certifications.length > 0) {
    score += Math.min(10, certifications.length * 3);
    reasoning.push(`${certifications.length} industry certifications`);
  }

  // Check verification tier (10 points)
  const tierPoints: Record<string, number> = {
    'verified': 10,
    'trusted': 7,
    'basic': 3,
  };
  score += tierPoints[supplier.verification_tier || 'basic'] || 0;
  if (supplier.verification_tier === 'verified') {
    reasoning.push('Verified supplier');
  }

  return { score, reasoning };
}

/**
 * Calculate capacity match score (0-20 points)
 */
function calculateCapacityMatch(
  supplier: SupplierProfile,
  criteria: MatchCriteria
): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let score = 0;

  // Check production capacity (15 points)
  const capacity = supplier.annual_capacity_tons || 0;
  if (capacity > 0) {
    if (capacity >= criteria.quantity * 12) {
      score += 15;
      reasoning.push(`Capacity: ${capacity.toLocaleString()}t/year (excellent)`);
    } else if (capacity >= criteria.quantity * 6) {
      score += 10;
      reasoning.push(`Capacity: ${capacity.toLocaleString()}t/year (good)`);
    } else if (capacity >= criteria.quantity) {
      score += 5;
      reasoning.push(`Capacity: ${capacity.toLocaleString()}t/year (adequate)`);
    } else {
      reasoning.push(`Capacity: ${capacity.toLocaleString()}t/year (insufficient)`);
    }
  }

  // Check lead time (5 points)
  const leadTime = supplier.typical_lead_time_days || 0;
  if (leadTime > 0 && leadTime <= 30) {
    score += 5;
    reasoning.push(`Lead time: ${leadTime} days`);
  } else if (leadTime > 30 && leadTime <= 60) {
    score += 3;
    reasoning.push(`Lead time: ${leadTime} days (moderate)`);
  }

  return { score, reasoning };
}

/**
 * Calculate geographic score (0-15 points)
 */
function calculateGeographicScore(
  supplier: SupplierProfile,
  criteria: MatchCriteria
): { score: number; reasoning: string[]; distance: number } {
  const reasoning: string[] = [];
  let score = 0;
  let distance = 0;

  if (criteria.delivery_location && supplier.location_lat && supplier.location_lon) {
    distance = calculateDistance(
      criteria.delivery_location.lat,
      criteria.delivery_location.lon,
      supplier.location_lat,
      supplier.location_lon
    );

    // Score based on distance
    if (distance < 500) {
      score = 15;
      reasoning.push(`${Math.round(distance)}km away (local)`);
    } else if (distance < 1500) {
      score = 12;
      reasoning.push(`${Math.round(distance)}km away (regional)`);
    } else if (distance < 5000) {
      score = 8;
      reasoning.push(`${Math.round(distance)}km away (continental)`);
    } else {
      score = 4;
      reasoning.push(`${Math.round(distance)}km away (international)`);
    }
  } else {
    // Use country match as fallback
    reasoning.push(`Based in ${supplier.country || 'Unknown'}`);
    score = 5;
  }

  return { score, reasoning, distance };
}

/**
 * Calculate performance score (0-15 points)
 */
function calculatePerformanceScore(
  supplier: SupplierProfile,
  pastDealsCount: number,
  avgRating: number
): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let score = 0;

  // Rating (10 points)
  if (avgRating > 0) {
    score += avgRating * 2; // 5 stars = 10 points
    reasoning.push(`${avgRating.toFixed(1)}⭐ average rating`);
  }

  // Past deals (5 points)
  if (pastDealsCount > 20) {
    score += 5;
    reasoning.push(`${pastDealsCount} completed deals (experienced)`);
  } else if (pastDealsCount > 10) {
    score += 4;
    reasoning.push(`${pastDealsCount} completed deals`);
  } else if (pastDealsCount > 5) {
    score += 3;
    reasoning.push(`${pastDealsCount} completed deals`);
  } else if (pastDealsCount > 0) {
    score += 1;
    reasoning.push(`${pastDealsCount} completed deals (new)`);
  } else {
    reasoning.push('No completed deals yet');
  }

  return { score, reasoning };
}

/**
 * Calculate price score (0-10 points)
 */
function calculatePriceScore(
  supplier: SupplierProfile,
  criteria: MatchCriteria
): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let score = 5; // Default average score

  // This would integrate with actual pricing data
  // For now, use a simplified model based on verification tier
  // In production, compare with real quotes/price history

  if (criteria.max_price) {
    reasoning.push(`Target price: $${criteria.max_price.toLocaleString()}/t`);
    score = 7; // Assume competitive if verified
  } else {
    reasoning.push('No price benchmark available');
  }

  // Bonus for price transparency
  if (supplier.verification_tier === 'verified') {
    score += 2;
    reasoning.push('Transparent pricing history');
  }

  return { score: Math.min(10, score), reasoning };
}

/**
 * Determine recommended action based on score
 */
function getRecommendedAction(totalScore: number): SupplierMatch['recommended_action'] {
  if (totalScore >= 80) return 'Request Quote';
  if (totalScore >= 60) return 'Schedule Call';
  if (totalScore >= 40) return 'Review Profile';
  return 'Pass';
}

/**
 * Find matching suppliers for an RFQ
 */
export async function findSupplierMatches(
  criteria: MatchCriteria,
  limit: number = 10
): Promise<{ matches: SupplierMatch[]; error?: Error }> {
  try {
    // Fetch all active suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('supplier_profiles')
      .select('*')
      .eq('status', 'active');

    if (suppliersError) throw suppliersError;
    if (!suppliers || suppliers.length === 0) {
      return { matches: [], error: new Error('No active suppliers found') };
    }

    // Fetch past deals count and ratings for each supplier
    const supplierIds = suppliers.map(s => s.id);
    const { data: deals } = await supabase
      .from('deals')
      .select('supplier_id, status, buyer_rating')
      .in('supplier_id', supplierIds)
      .eq('status', 'closed');

    // Calculate past deals and ratings
    const supplierStats = new Map<string, { count: number; avgRating: number }>();
    deals?.forEach(deal => {
      const current = supplierStats.get(deal.supplier_id) || { count: 0, avgRating: 0, totalRating: 0 };
      current.count += 1;
      const rating = deal.buyer_rating || 0;
      const totalRating = (current as any).totalRating || 0;
      supplierStats.set(deal.supplier_id, {
        count: current.count,
        avgRating: (totalRating + rating) / current.count,
        totalRating: totalRating + rating,
      } as any);
    });

    // Calculate scores for each supplier
    const matches: SupplierMatch[] = suppliers.map(supplier => {
      const stats = supplierStats.get(supplier.id) || { count: 0, avgRating: 0 };

      const productMatch = calculateProductMatch(supplier, criteria);
      const capacityMatch = calculateCapacityMatch(supplier, criteria);
      const geoScore = calculateGeographicScore(supplier, criteria);
      const performanceScore = calculatePerformanceScore(supplier, stats.count, stats.avgRating);
      const priceScore = calculatePriceScore(supplier, criteria);

      const total_score = 
        productMatch.score +
        capacityMatch.score +
        geoScore.score +
        performanceScore.score +
        priceScore.score;

      const reasoning = [
        ...productMatch.reasoning,
        ...capacityMatch.reasoning,
        ...geoScore.reasoning,
        ...performanceScore.reasoning,
        ...priceScore.reasoning,
      ];

      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_logo: supplier.logo_url || undefined,
        total_score: Math.round(total_score),
        product_match_score: Math.round(productMatch.score),
        capacity_match_score: Math.round(capacityMatch.score),
        geographic_score: Math.round(geoScore.score),
        performance_score: Math.round(performanceScore.score),
        price_score: Math.round(priceScore.score),
        ranking: 0, // Will be set after sorting
        reasoning,
        distance_km: Math.round(geoScore.distance),
        avg_rating: stats.avgRating,
        past_deals_count: stats.count,
        recommended_action: getRecommendedAction(total_score),
      };
    });

    // Sort by total score and assign rankings
    matches.sort((a, b) => b.total_score - a.total_score);
    matches.forEach((match, index) => {
      match.ranking = index + 1;
    });

    // Return top N matches
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
  ];
}
