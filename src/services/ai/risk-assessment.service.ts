/**
 * Risk Assessment Service - AI-powered risk analysis for deals, suppliers, RFQs, and markets
 * Uses mock data for demo - in production would integrate with real data sources
 * 
 * Risk Scoring (0-100, higher = riskier):
 * - 0-25: Low Risk (green)
 * - 26-50: Medium Risk (yellow)
 * - 51-75: High Risk (orange)
 * - 76-100: Critical Risk (red)
 */

export type EntityType = 'Deal' | 'Supplier' | 'RFQ' | 'Market';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskFactor {
  category: 'supplier' | 'deal' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
}

export interface RiskAssessment {
  entity_type: EntityType;
  entity_id: string;
  overall_risk: RiskLevel;
  risk_score: number; // 0-100
  supplier_risk_factors: RiskFactor[];
  deal_risk_factors: RiskFactor[];
  market_risk_factors: RiskFactor[];
  recommendations: string[];
  should_flag: boolean;
  assessed_at: string;
}

/**
 * Calculate risk level from score
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return 'Critical';
  if (score >= 51) return 'High';
  if (score >= 26) return 'Medium';
  return 'Low';
}

/**
 * Perform risk assessment for an entity
 * Uses mock data for demo purposes
 */
export async function assessRisk(
  entityType: EntityType,
  entityId: string
): Promise<{ assessment: RiskAssessment | null; error?: Error }> {
  try {
    // For demo, return mock assessment
    const assessment = getMockRiskAssessment(entityType, entityId);
    return { assessment };
  } catch (error) {
    console.error('Error assessing risk:', error);
    return {
      assessment: null,
      error: error instanceof Error ? error : new Error('Unknown error assessing risk'),
    };
  }
}

/**
 * Get mock risk assessment for testing
 */
export function getMockRiskAssessment(entityType: EntityType, entityId: string): RiskAssessment {
  const mockData: Record<EntityType, RiskAssessment> = {
    Deal: {
      entity_type: 'Deal',
      entity_id: entityId,
      overall_risk: 'Medium',
      risk_score: 42,
      supplier_risk_factors: [
        { category: 'supplier', severity: 'medium', description: 'Unverified supplier', impact: 'Limited due diligence completed' },
        { category: 'supplier', severity: 'low', description: 'Limited production capacity', impact: 'May struggle with large orders' },
      ],
      deal_risk_factors: [
        { category: 'deal', severity: 'medium', description: 'Low advance payment (<30%)', impact: 'Supplier may delay or cancel order' },
      ],
      market_risk_factors: [
        { category: 'market', severity: 'low', description: 'Moderate price volatility (12.3%)', impact: 'Some price uncertainty' },
      ],
      recommendations: [
        'Request additional supplier documentation and certifications',
        'Negotiate higher advance payment (30-50%) to secure commitment',
        'Consider price protection mechanism (fixed price or collar)',
      ],
      should_flag: false,
      assessed_at: new Date().toISOString(),
    },
    Supplier: {
      entity_type: 'Supplier',
      entity_id: entityId,
      overall_risk: 'High',
      risk_score: 68,
      supplier_risk_factors: [
        { category: 'supplier', severity: 'high', description: 'Low average rating (3.2/5)', impact: 'Poor past performance indicates reliability risk' },
        { category: 'supplier', severity: 'medium', description: 'No recent deal activity', impact: 'Supplier may be inactive or facing issues' },
        { category: 'supplier', severity: 'medium', description: 'Unverified supplier', impact: 'Limited due diligence completed' },
      ],
      deal_risk_factors: [],
      market_risk_factors: [],
      recommendations: [
        'Request additional supplier documentation and certifications',
        'Schedule detailed performance review call with supplier',
        'Require senior manager approval before finalizing',
      ],
      should_flag: true,
      assessed_at: new Date().toISOString(),
    },
    RFQ: {
      entity_type: 'RFQ',
      entity_id: entityId,
      overall_risk: 'Low',
      risk_score: 18,
      supplier_risk_factors: [],
      deal_risk_factors: [],
      market_risk_factors: [
        { category: 'market', severity: 'low', description: 'Moderate price volatility (8.5%)', impact: 'Some price uncertainty' },
      ],
      recommendations: ['No specific risks identified - proceed with standard due diligence'],
      should_flag: false,
      assessed_at: new Date().toISOString(),
    },
    Market: {
      entity_type: 'Market',
      entity_id: entityId,
      overall_risk: 'High',
      risk_score: 62,
      supplier_risk_factors: [],
      deal_risk_factors: [],
      market_risk_factors: [
        { category: 'market', severity: 'high', description: 'High price volatility (18.7%)', impact: 'Significant price fluctuations expected' },
        { category: 'market', severity: 'high', description: 'Tight supply conditions', impact: 'Potential supply shortages or delays' },
      ],
      recommendations: [
        'Consider price protection mechanism (fixed price or collar)',
        'Lock in supply early with confirmed PO and advance payment',
        'Require senior manager approval before finalizing',
      ],
      should_flag: true,
      assessed_at: new Date().toISOString(),
    },
  };

  return mockData[entityType];
}
