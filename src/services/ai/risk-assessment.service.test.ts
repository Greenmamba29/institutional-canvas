import { describe, expect, it } from 'vitest';
import { assessRiskFromContext } from './risk-assessment.service';

describe('assessRiskFromContext', () => {
  it('flags hazardous lithium recycling supplier risks with human-verifiable recommendations', () => {
    const assessment = assessRiskFromContext({
      entityType: 'Supplier',
      entityId: 'supplier-1',
      supplier: {
        supplier_id: 'supplier-1',
        supplier_name: 'Damaged Battery Processor',
        verification_tier: null,
        certifications: [],
        documents: [],
        reviews: [{ rating: 2 }],
        capabilities: {
          hazardous_materials: true,
          black_mass: true,
          damaged_batteries: true,
        },
        past_deals_count: 0,
      },
    });

    expect(assessment.overall_risk).toBe('Critical');
    expect(assessment.should_flag).toBe(true);
    expect(assessment.supplier_risk_factors.map((factor) => factor.description)).toContain('Hazardous material capability without current SDS/MSDS on file');
    expect(assessment.recommendations).toContain('Require compliance reviewer approval before hazardous material movement');
  });

  it('keeps verified suppliers with current compliance evidence below manual review threshold', () => {
    const assessment = assessRiskFromContext({
      entityType: 'Supplier',
      entityId: 'supplier-2',
      supplier: {
        supplier_id: 'supplier-2',
        supplier_name: 'Verified Recycler',
        verification_tier: 'gold',
        certifications: [{ certification_type: 'ISO 14001' }, { certification_type: 'R2' }],
        documents: [{ document_type: 'SDS', expires_at: '2099-01-01' }],
        reviews: [{ rating: 5 }, { rating: 4 }],
        capabilities: { hazardous_materials: true, black_mass: true },
        past_deals_count: 12,
      },
    });

    expect(assessment.overall_risk).toBe('Low');
    expect(assessment.should_flag).toBe(false);
  });
});
