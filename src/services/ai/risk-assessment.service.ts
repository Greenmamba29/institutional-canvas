/**
 * Risk Assessment Service - deterministic risk analysis for deals, suppliers,
 * RFQs, markets, and lithium recycling workflows.
 *
 * AI can explain these scores, but compliance-sensitive decisions must remain
 * source-backed and human-reviewable.
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

export interface RiskDocumentInput {
  document_type?: string | null;
  expires_at?: string | null;
  expiry_date?: string | null;
  status?: string | null;
}

export interface RiskSupplierContext {
  supplier_id: string;
  supplier_name?: string | null;
  verification_tier?: string | null;
  certifications?: { certification_type?: string | null; expiry_date?: string | null }[];
  documents?: RiskDocumentInput[];
  reviews?: { rating?: number | null }[];
  capabilities?: unknown;
  past_deals_count?: number;
}

export interface RiskDealContext {
  status?: string | null;
  title?: string | null;
  has_contract?: boolean;
  has_purchase_order?: boolean;
  has_invoice_match?: boolean;
}

export interface RiskMarketContext {
  price_volatility_percent?: number | null;
  supply_outlook?: 'tight' | 'balanced' | 'loose' | string | null;
}

export interface RiskAssessmentContext {
  entityType: EntityType;
  entityId: string;
  supplier?: RiskSupplierContext | null;
  deal?: RiskDealContext | null;
  market?: RiskMarketContext | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return 'Critical';
  if (score >= 51) return 'High';
  if (score >= 26) return 'Medium';
  return 'Low';
}

function severityPoints(severity: RiskFactor['severity']): number {
  if (severity === 'critical') return 34;
  if (severity === 'high') return 24;
  if (severity === 'medium') return 14;
  return 6;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function hasCapability(capabilities: unknown, keys: string[]): boolean {
  const record = asRecord(capabilities);
  return keys.some((key) => record[key] === true || String(record[key] ?? '').toLowerCase() === 'true');
}

function hasCurrentDocument(documents: RiskDocumentInput[] = [], wantedTypes: string[]): boolean {
  const now = Date.now();
  return documents.some((document) => {
    const type = (document.document_type ?? '').toLowerCase();
    const typeMatches = wantedTypes.some((wanted) => type.includes(wanted.toLowerCase()));
    if (!typeMatches) return false;
    const expiry = document.expires_at ?? document.expiry_date;
    return !expiry || new Date(expiry).getTime() > now;
  });
}

function averageRating(reviews: { rating?: number | null }[] = []): number {
  const ratings = reviews.map((review) => Number(review.rating)).filter(Number.isFinite);
  return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function assessRiskFromContext(context: RiskAssessmentContext): RiskAssessment {
  const supplierFactors: RiskFactor[] = [];
  const dealFactors: RiskFactor[] = [];
  const marketFactors: RiskFactor[] = [];
  const recommendations: string[] = [];

  const supplier = context.supplier;
  if (supplier) {
    const certifications = supplier.certifications ?? [];
    const documents = supplier.documents ?? [];
    const hazardous = hasCapability(supplier.capabilities, ['hazardous_materials', 'hazardousMaterial', 'damaged_batteries']);
    const blackMass = hasCapability(supplier.capabilities, ['black_mass', 'blackMass']);
    const rating = averageRating(supplier.reviews);

    if (!supplier.verification_tier) {
      supplierFactors.push({
        category: 'supplier',
        severity: 'high',
        description: 'Unverified supplier',
        impact: 'Supplier profile lacks verified onboarding and due-diligence status.',
      });
      recommendations.push('Complete supplier verification before award decision');
    }

    if (!certifications.length) {
      supplierFactors.push({
        category: 'supplier',
        severity: hazardous ? 'critical' : 'medium',
        description: 'No supplier certifications on file',
        impact: 'Compliance, quality, and recycler permit evidence is missing.',
      });
      recommendations.push('Request supplier permits, quality certifications, and operating licenses');
    }

    if (hazardous && !hasCurrentDocument(documents, ['sds', 'msds'])) {
      supplierFactors.push({
        category: 'supplier',
        severity: 'critical',
        description: 'Hazardous material capability without current SDS/MSDS on file',
        impact: 'Damaged batteries or hazardous black mass cannot move without source-backed safety documentation.',
      });
      recommendations.push('Require current SDS/MSDS upload before shipment or RFQ award');
      recommendations.push('Require compliance reviewer approval before hazardous material movement');
    }

    if (blackMass && !hasCurrentDocument(documents, ['assay', 'certificate of analysis', 'coa'])) {
      supplierFactors.push({
        category: 'supplier',
        severity: 'high',
        description: 'Black mass supplier missing current assay evidence',
        impact: 'Metal content and payable value are uncertain without verified assay support.',
      });
      recommendations.push('Require assay certificate verification before price finalization');
    }

    if (rating > 0 && rating < 3.5) {
      supplierFactors.push({
        category: 'supplier',
        severity: 'high',
        description: `Low average rating (${rating.toFixed(1)}/5)`,
        impact: 'Poor past performance indicates reliability or fraud risk.',
      });
      recommendations.push('Schedule supplier performance review before award');
    }

    if ((supplier.past_deals_count ?? 0) === 0) {
      supplierFactors.push({
        category: 'supplier',
        severity: 'medium',
        description: 'No completed deal history',
        impact: 'Counterparty performance is unproven in this workspace.',
      });
    }
  }

  const deal = context.deal;
  if (deal) {
    if (!deal.has_contract) {
      dealFactors.push({
        category: 'deal',
        severity: 'medium',
        description: 'Contract not uploaded',
        impact: 'Award and obligation terms are not source-backed in the platform.',
      });
      recommendations.push('Upload contract or award letter before procurement closeout');
    }
    if (deal.status === 'awarded' && !deal.has_purchase_order) {
      dealFactors.push({
        category: 'deal',
        severity: 'medium',
        description: 'Awarded deal missing purchase order',
        impact: 'Post-award controls and invoice matching cannot proceed.',
      });
    }
  }

  const market = context.market;
  if (market) {
    const volatility = Number(market.price_volatility_percent ?? 0);
    if (volatility >= 15) {
      marketFactors.push({
        category: 'market',
        severity: 'high',
        description: `High price volatility (${volatility.toFixed(1)}%)`,
        impact: 'Metal price movement can materially alter payable economics.',
      });
      recommendations.push('Use deterministic pricing formulas with source price references');
    }
    if (market.supply_outlook === 'tight') {
      marketFactors.push({
        category: 'market',
        severity: 'high',
        description: 'Tight supply conditions',
        impact: 'Supplier capacity and shipment timing may be constrained.',
      });
    }
  }

  const allFactors = [...supplierFactors, ...dealFactors, ...marketFactors];
  const rawScore = allFactors.reduce((score, factor) => score + severityPoints(factor.severity), 0);
  const risk_score = clamp(rawScore, 0, 100);

  return {
    entity_type: context.entityType,
    entity_id: context.entityId,
    overall_risk: getRiskLevel(risk_score),
    risk_score,
    supplier_risk_factors: supplierFactors,
    deal_risk_factors: dealFactors,
    market_risk_factors: marketFactors,
    recommendations: unique(recommendations.length ? recommendations : ['No specific risks identified - proceed with standard due diligence']),
    should_flag: risk_score >= 51 || allFactors.some((factor) => factor.severity === 'critical'),
    assessed_at: new Date().toISOString(),
  };
}

/**
 * Perform risk assessment for an entity.
 */
export async function assessRisk(
  entityType: EntityType,
  entityId: string,
  context?: Omit<RiskAssessmentContext, 'entityType' | 'entityId'>
): Promise<{ assessment: RiskAssessment | null; error?: Error }> {
  try {
    const assessment = context
      ? assessRiskFromContext({ entityType, entityId, ...context })
      : getMockRiskAssessment(entityType, entityId);
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
 * Get mock risk assessment for demos and empty-state fallbacks.
 */
export function getMockRiskAssessment(entityType: EntityType, entityId: string): RiskAssessment {
  const mockData: Record<EntityType, RiskAssessment> = {
    Deal: assessRiskFromContext({
      entityType: 'Deal',
      entityId,
      supplier: {
        supplier_id: 'mock-supplier',
        supplier_name: 'GlobalLithium Solutions',
        verification_tier: 'silver',
        certifications: [{ certification_type: 'ISO 14001' }],
        documents: [{ document_type: 'SDS', expires_at: '2099-01-01' }],
        reviews: [{ rating: 4.2 }],
        past_deals_count: 4,
      },
      deal: { status: 'draft', has_contract: false },
      market: { price_volatility_percent: 12.3, supply_outlook: 'balanced' },
    }),
    Supplier: assessRiskFromContext({
      entityType: 'Supplier',
      entityId,
      supplier: {
        supplier_id: entityId,
        supplier_name: 'Unverified Recycler',
        verification_tier: null,
        certifications: [],
        documents: [],
        reviews: [{ rating: 3.2 }],
        capabilities: { hazardous_materials: true, black_mass: true },
        past_deals_count: 0,
      },
    }),
    RFQ: assessRiskFromContext({
      entityType: 'RFQ',
      entityId,
      market: { price_volatility_percent: 8.5, supply_outlook: 'balanced' },
    }),
    Market: assessRiskFromContext({
      entityType: 'Market',
      entityId,
      market: { price_volatility_percent: 18.7, supply_outlook: 'tight' },
    }),
  };

  return mockData[entityType];
}
