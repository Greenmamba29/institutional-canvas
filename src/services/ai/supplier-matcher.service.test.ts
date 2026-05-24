import { describe, expect, it } from 'vitest';
import { scoreSupplierMatches, type MatchCriteria, type SupplierMatchInput } from './supplier-matcher.service';

describe('scoreSupplierMatches', () => {
  const criteria: MatchCriteria = {
    rfq_id: 'rfq-1',
    commodity: 'Lithium Carbonate',
    quantity: 500,
    delivery_location: { lat: 0, lon: 0 },
    max_price: 20_000,
  };

  it('ranks real supplier candidates by product, capacity, compliance, distance, performance, and price fit', () => {
    const candidates: SupplierMatchInput[] = [
      {
        supplier_id: 'weak',
        supplier_name: 'Weak Generic Metals',
        products: [{ name: 'Copper Cathode', product_type: 'Copper', min_order_quantity: 100, price_per_unit: 25_000 }],
        certifications: [],
        reviews: [{ rating: 3 }],
        locations: [{ country: 'CL', coordinates: { lat: 70, lon: 70 } }],
        verification_tier: null,
      },
      {
        supplier_id: 'strong',
        supplier_name: 'Strong Lithium Recycler',
        products: [{ name: 'Battery-grade Lithium Carbonate', product_type: 'Lithium Carbonate', min_order_quantity: 600, price_per_unit: 18_500 }],
        certifications: [{ certification_type: 'ISO 14001' }, { certification_type: 'R2' }],
        reviews: [{ rating: 5 }, { rating: 4 }],
        locations: [{ country: 'US', coordinates: { lat: 1, lon: 1 } }],
        verification_tier: 'gold',
        past_deals_count: 8,
      },
    ];

    const matches = scoreSupplierMatches(criteria, candidates);

    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({
      supplier_id: 'strong',
      ranking: 1,
      recommended_action: 'Request Quote',
    });
    expect(matches[0].total_score).toBeGreaterThan(matches[1].total_score);
    expect(matches[0].reasoning).toContain('Offers Lithium Carbonate');
    expect(matches[0].reasoning.some((reason) => reason.includes('2 compliance certifications'))).toBe(true);
  });

  it('returns review-profile recommendations for weak non-matching candidates', () => {
    const matches = scoreSupplierMatches(criteria, [
      {
        supplier_id: 'weak',
        supplier_name: 'Unverified Supplier',
        products: [{ name: 'Graphite', product_type: 'Graphite', price_per_unit: 40_000 }],
        certifications: [],
        reviews: [{ rating: 2 }],
        locations: [],
        verification_tier: null,
      },
    ]);

    expect(matches[0].recommended_action).toBe('Pass');
    expect(matches[0].reasoning).toContain('No matching lithium product found');
  });
});
