/**
 * Risk Assessment Service - AI-powered risk analysis for deals, suppliers, RFQs, and markets
 * 
 * Risk Scoring (0-100, higher = riskier):
 * - 0-25: Low Risk (green)
 * - 26-50: Medium Risk (yellow)
 * - 51-75: High Risk (orange)
 * - 76-100: Critical Risk (red)
 */

import { supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

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
 * Assess supplier-related risks
 */
async function assessSupplierRisks(supplierId: string): Promise<{ score: number; factors: RiskFactor[] }> {
  const factors: RiskFactor[] = [];
  let score = 0;

  const { data: supplier } = await supabase
    .from('supplier_profiles')
    .select('*, deals(status, amount, buyer_rating)')
    .eq('id', supplierId)
    .single();

  if (!supplier) {
    return { score: 100, factors: [{ category: 'supplier', severity: 'critical', description: 'Supplier not found', impact: 'Cannot proceed with deal' }] };
  }

  // Verification risk
  if (supplier.verification_tier === 'basic') {
    score += 20;
    factors.push({
      category: 'supplier',
      severity: 'medium',
      description: 'Unverified supplier',
      impact: 'Limited due diligence completed',
    });
  }

  // Financial stability
  const deals = (supplier.deals as any[]) || [];
  const recentDeals = deals.filter((d: any) => new Date(d.created_at).getTime() > Date.now() - 180 * 24 * 60 * 60 * 1000);
  if (recentDeals.length === 0) {
    score += 15;
    factors.push({
      category: 'supplier',
      severity: 'medium',
      description: 'No recent deal activity',
      impact: 'Supplier may be inactive or facing issues',
    });
  }

  // Rating concerns
  const avgRating = deals.reduce((acc: number, d: any) => acc + (d.buyer_rating || 0), 0) / deals.length;
  if (avgRating < 3.5 && deals.length > 0) {
    score += 25;
    factors.push({
      category: 'supplier',
      severity: 'high',
      description: `Low average rating (${avgRating.toFixed(1)}/5)`,
      impact: 'Poor past performance indicates reliability risk',
    });
  }

  // Capacity risk
  const totalCapacity = supplier.annual_capacity_tons || 0;
  if (totalCapacity < 10000) {
    score += 10;
    factors.push({
      category: 'supplier',
      severity: 'low',
      description: 'Limited production capacity',
      impact: 'May struggle with large orders',
    });
  }

  return { score: Math.min(100, score), factors };
}

/**
 * Assess deal-specific risks
 */
async function assessDealRisks(dealId: string): Promise<{ score: number; factors: RiskFactor[] }> {
  const factors: RiskFactor[] = [];
  let score = 0;

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (!deal) {
    return { score: 100, factors: [{ category: 'deal', severity: 'critical', description: 'Deal not found', impact: 'Invalid deal reference' }] };
  }

  // Payment terms risk
  const paymentTerms = (deal.payment_terms as any) || {};
  if (paymentTerms.advance_percentage < 30) {
    score += 15;
    factors.push({
      category: 'deal',
      severity: 'medium',
      description: 'Low advance payment (<30%)',
      impact: 'Supplier may delay or cancel order',
    });
  }

  // Delivery timeline
  const deliveryDate = new Date(deal.delivery_date || Date.now());
  const daysUntilDelivery = Math.floor((deliveryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilDelivery < 30) {
    score += 20;
    factors.push({
      category: 'deal',
      severity: 'high',
      description: 'Tight delivery timeline (<30 days)',
      impact: 'High risk of delays or quality issues',
    });
  }

  // Contract status
  if (deal.status === 'pending') {
    score += 10;
    factors.push({
      category: 'deal',
      severity: 'low',
      description: 'Contract not finalized',
      impact: 'Deal terms may change',
    });
  }

  // Price volatility
  const dealPrice = deal.unit_price || 0;
  if (dealPrice > 20000) {
    score += 10;
    factors.push({
      category: 'deal',
      severity: 'low',
      description: 'Price above market average',
      impact: 'May indicate inflated pricing',
    });
  }

  return { score: Math.min(100, score), factors };
}

/**
 * Assess market-related risks
 */
async function assessMarketRisks(commodity: string): Promise<{ score: number; factors: RiskFactor[] }> {
  const factors: RiskFactor[] = [];
  let score = 0;

  // Get recent price indicators
  const { data: priceData } = await supabase
    .from('price_indicators')
    .select('*')
    .eq('commodity', commodity)
    .order('date', { ascending: false })
    .limit(30);

  if (!priceData || priceData.length === 0) {
    factors.push({
      category: 'market',
      severity: 'low',
      description: 'Limited market data',
      impact: 'Difficult to assess market conditions',
    });
    score += 5;
    return { score, factors };
  }

  // Price volatility
  const prices = priceData.map((p: any) => p.spot_price || 0);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const volatility = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length) / avgPrice;

  if (volatility > 0.15) {
    score += 25;
    factors.push({
      category: 'market',
      severity: 'high',
      description: `High price volatility (${(volatility * 100).toFixed(1)}%)`,
      impact: 'Significant price fluctuations expected',
    });
  } else if (volatility > 0.10) {
    score += 15;
    factors.push({
      category: 'market',
      severity: 'medium',
      description: `Moderate price volatility (${(volatility * 100).toFixed(1)}%)`,
      impact: 'Some price uncertainty',
    });
  }

  // Supply constraints
  const supplyScore = priceData[0]?.supply_score || 50;
  if (supplyScore < 40) {
    score += 20;
    factors.push({
      category: 'market',
      severity: 'high',
      description: 'Tight supply conditions',
      impact: 'Potential supply shortages or delays',
    });
  }

  return { score: Math.min(100, score), factors };
}

/**
 * Generate mitigation recommendations
 */
function generateRecommendations(assessment: RiskAssessment): string[] {
  const recommendations: string[] = [];
  const allFactors = [...assessment.supplier_risk_factors, ...assessment.deal_risk_factors, ...assessment.market_risk_factors];

  // Supplier-specific recommendations
  if (allFactors.some(f => f.description.includes('Unverified'))) {
    recommendations.push('Request additional supplier documentation and certifications');
  }
  if (allFactors.some(f => f.description.includes('rating'))) {
    recommendations.push('Schedule detailed performance review call with supplier');
  }

  // Deal-specific recommendations
  if (allFactors.some(f => f.description.includes('advance payment'))) {
    recommendations.push('Negotiate higher advance payment (30-50%) to secure commitment');
  }
  if (allFactors.some(f => f.description.includes('timeline'))) {
    recommendations.push('Build buffer time into delivery schedule or arrange backup supplier');
  }

  // Market-specific recommendations
  if (allFactors.some(f => f.description.includes('volatility'))) {
    recommendations.push('Consider price protection mechanism (fixed price or collar)');
  }
  if (allFactors.some(f => f.description.includes('supply'))) {
    recommendations.push('Lock in supply early with confirmed PO and advance payment');
  }

  // Risk level recommendations
  if (assessment.risk_score >= 76) {
    recommendations.push('Escalate to executive team for approval before proceeding');
  } else if (assessment.risk_score >= 51) {
    recommendations.push('Require senior manager approval before finalizing');
  }

  return recommendations.length > 0 ? recommendations : ['No specific risks identified - proceed with standard due diligence'];
}

/**
 * Perform risk assessment for an entity
 */
export async function assessRisk(
  entityType: EntityType,
  entityId: string
): Promise<{ assessment: RiskAssessment | null; error?: Error }> {
  try {
    let supplierScore = 0;
    let dealScore = 0;
    let marketScore = 0;
    let supplierFactors: RiskFactor[] = [];
    let dealFactors: RiskFactor[] = [];
    let marketFactors: RiskFactor[] = [];

    // Assess based on entity type
    if (entityType === 'Supplier') {
      const result = await assessSupplierRisks(entityId);
      supplierScore = result.score;
      supplierFactors = result.factors;
    } else if (entityType === 'Deal') {
      const dealResult = await assessDealRisks(entityId);
      dealScore = dealResult.score;
      dealFactors = dealResult.factors;

      // Also assess supplier for the deal
      const { data: deal } = await supabase.from('deals').select('supplier_id').eq('id', entityId).single();
      if (deal?.supplier_id) {
        const supplierResult = await assessSupplierRisks(deal.supplier_id);
        supplierScore = supplierResult.score * 0.7; // Weight supplier risk lower for deal assessment
        supplierFactors = supplierResult.factors;
      }

      // Market assessment
      const marketResult = await assessMarketRisks('lithium_carbonate');
      marketScore = marketResult.score * 0.5; // Weight market risk lower
      marketFactors = marketResult.factors;
    } else if (entityType === 'RFQ') {
      // For RFQ, assess market conditions
      const marketResult = await assessMarketRisks('lithium_carbonate');
      marketScore = marketResult.score;
      marketFactors = marketResult.factors;
    } else if (entityType === 'Market') {
      const marketResult = await assessMarketRisks(entityId);
      marketScore = marketResult.score;
      marketFactors = marketResult.factors;
    }

    // Calculate overall risk score (weighted average)
    const totalScore = supplierScore + dealScore + marketScore;
    const riskScore = Math.min(100, Math.round(totalScore));

    const assessment: RiskAssessment = {
      entity_type: entityType,
      entity_id: entityId,
      overall_risk: getRiskLevel(riskScore),
      risk_score: riskScore,
      supplier_risk_factors: supplierFactors,
      deal_risk_factors: dealFactors,
      market_risk_factors: marketFactors,
      recommendations: [],
      should_flag: riskScore >= 51,
      assessed_at: new Date().toISOString(),
    };

    assessment.recommendations = generateRecommendations(assessment);

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
