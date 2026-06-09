/**
 * Risk Assessment Service - deterministic, rule-based risk analysis for suppliers/orgs
 *
 * Scoring is computed transparently from REAL Supabase data (suppliers / organizations).
 * There is NO LLM call and NO fabricated data. Every point added to the score maps to a
 * concrete RiskFactor with a real reason and weight, so the result is fully explainable.
 *
 * Risk Scoring (0-100, higher = riskier):
 * - 0-25:  Low Risk (green)
 * - 26-50: Medium Risk (yellow)
 * - 51-75: High Risk (orange)
 * - 76-100: Critical Risk (red)
 */

import { supabase } from '@/lib/supabase/rpc';

export type EntityType = 'Deal' | 'Supplier' | 'RFQ' | 'Market';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskFactor {
  category: 'supplier' | 'deal' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  /** Points this factor contributes to the overall risk score (transparency). */
  weight: number;
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
 * Calculate risk level from score (thresholds shared with the UI gauge).
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return 'Critical';
  if (score >= 51) return 'High';
  if (score >= 26) return 'Medium';
  return 'Low';
}

/**
 * Severity bucket from a single factor's weight (for UI badge coloring).
 */
function severityFromWeight(weight: number): RiskFactor['severity'] {
  if (weight >= 25) return 'critical';
  if (weight >= 15) return 'high';
  if (weight >= 8) return 'medium';
  return 'low';
}

/**
 * Basic country-risk map keyed by lowercased substring matched against a
 * supplier's headquarters / organization jurisdiction. Higher = riskier
 * sourcing jurisdiction (supply-chain, trade-policy and concentration risk).
 */
const COUNTRY_RISK: Array<{ match: string[]; weight: number; label: string }> = [
  { match: ['usa', 'united states', 'canada', 'australia'], weight: 0, label: 'low-risk jurisdiction' },
  { match: ['chile', 'argentina'], weight: 6, label: 'moderate sourcing jurisdiction' },
  { match: ['china'], weight: 14, label: 'concentration / trade-policy exposure (China)' },
  { match: ['russia', 'congo', 'drc', 'myanmar'], weight: 22, label: 'high-risk jurisdiction' },
];

function lookupCountryRisk(text: string | null | undefined): { weight: number; label: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const entry of COUNTRY_RISK) {
    if (entry.match.some((m) => lower.includes(m))) {
      return { weight: entry.weight, label: entry.label };
    }
  }
  // Unknown / unmapped jurisdiction carries mild uncertainty risk.
  return { weight: 8, label: 'unmapped jurisdiction' };
}

interface SupplierRow {
  org_id: string;
  display_name: string | null;
  verification_tier: string | null;
  claim_status: string | null;
  organization_id: string | null;
  capabilities: Record<string, unknown> | null;
  public_profile: Record<string, unknown> | null;
}

interface OrgRow {
  id: string;
  name: string | null;
  org_type: string | null;
  status: string | null;
  jurisdiction: string | null;
  override_tier: string | null;
}

/**
 * Compute risk factors for a supplier row from REAL signals.
 */
function buildSupplierFactors(s: SupplierRow, org: OrgRow | null): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const tier = (s.verification_tier ?? '').toLowerCase();

  // 1. Verification tier — unverified/standard carries materially more risk than gold.
  if (tier === 'gold' || tier === 'platinum') {
    factors.push({
      category: 'supplier',
      severity: 'low',
      weight: 0,
      description: `Verified ${tier} tier supplier`,
      impact: 'Highest level of due diligence completed — low counterparty risk',
    });
  } else if (tier === 'silver') {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(10),
      weight: 10,
      description: 'Silver verification tier (partial verification)',
      impact: 'Some due diligence completed, but below top-tier assurance',
    });
  } else if (tier === 'bronze' || tier === 'standard') {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(18),
      weight: 18,
      description: `Low verification tier (${tier})`,
      impact: 'Limited verification — elevated counterparty risk',
    });
  } else {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(28),
      weight: 28,
      description: 'Unverified supplier (no verification tier)',
      impact: 'No due diligence on record — high counterparty risk',
    });
  }

  // 2. Claim status — an unclaimed profile means no verified org owner.
  if (!s.claim_status || s.claim_status.toLowerCase() === 'unclaimed') {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(12),
      weight: 12,
      description: 'Profile not claimed by a verified organization',
      impact: 'No confirmed organizational owner controls this profile',
    });
  }

  // 3. Linked organization — lack of a linked org reduces accountability/order history.
  if (!s.organization_id && !org) {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(10),
      weight: 10,
      description: 'No linked organization record',
      impact: 'No order history or organizational accountability trail available',
    });
  }

  // 4. Jurisdiction / country risk — from org.jurisdiction first, else public_profile headquarters.
  const hq = (s.public_profile?.['headquarters'] as string | undefined) ?? null;
  const jurisdiction = org?.jurisdiction ?? hq;
  const country = lookupCountryRisk(jurisdiction);
  if (country && country.weight > 0) {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(country.weight),
      weight: country.weight,
      description: `Jurisdiction risk: ${jurisdiction} (${country.label})`,
      impact: 'Geographic / trade-policy exposure affects supply reliability',
    });
  }

  // 5. Organization status — suspended/inactive orgs are riskier.
  if (org && org.status && !['active', 'verified'].includes(org.status.toLowerCase())) {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(20),
      weight: 20,
      description: `Linked organization status is "${org.status}"`,
      impact: 'Organization is not in good standing',
    });
  }

  // 6. Profile completeness — missing capabilities/profile data lowers confidence.
  const caps = s.capabilities ?? {};
  const profile = s.public_profile ?? {};
  const products = Array.isArray(caps['products']) ? (caps['products'] as unknown[]) : [];
  if (products.length === 0) {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(8),
      weight: 8,
      description: 'No product capabilities listed',
      impact: 'Cannot confirm what the supplier can actually deliver',
    });
  }
  if (caps['capacity_mt'] == null) {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(6),
      weight: 6,
      description: 'No production capacity on record',
      impact: 'Unknown ability to fulfill large orders',
    });
  }
  const completenessKeys = ['founded', 'headquarters', 'description'];
  const missing = completenessKeys.filter((k) => profile[k] == null || profile[k] === '');
  if (missing.length > 0) {
    factors.push({
      category: 'supplier',
      severity: severityFromWeight(missing.length * 3),
      weight: missing.length * 3,
      description: `Incomplete public profile (missing: ${missing.join(', ')})`,
      impact: 'Reduced transparency lowers confidence in the supplier',
    });
  }

  return factors;
}

function buildRecommendations(factors: RiskFactor[], level: RiskLevel): string[] {
  const recs: string[] = [];
  const has = (sub: string) => factors.some((f) => f.description.toLowerCase().includes(sub));

  if (has('unverified') || has('verification tier')) {
    recs.push('Request additional supplier documentation and complete tier verification');
  }
  if (has('not claimed') || has('no linked organization')) {
    recs.push('Require the supplier to claim and verify their organization profile');
  }
  if (has('jurisdiction risk')) {
    recs.push('Assess geographic/trade-policy exposure and consider diversifying sourcing');
  }
  if (has('not in good standing') || has('organization status')) {
    recs.push('Confirm the linked organization is active and in good standing before proceeding');
  }
  if (has('incomplete public profile') || has('no product capabilities') || has('no production capacity')) {
    recs.push('Request complete profile, capacity, and product data from the supplier');
  }
  if (level === 'Critical' || level === 'High') {
    recs.push('Require senior manager approval before finalizing any deal with this supplier');
  }
  if (recs.length === 0) {
    recs.push('No significant risks identified — proceed with standard due diligence');
  }
  return recs;
}

/**
 * Perform a deterministic, rule-based risk assessment for a real entity.
 * Currently supports supplier/org entities (entityId = suppliers.org_id).
 */
export async function assessRisk(
  entityType: EntityType,
  entityId: string
): Promise<{ assessment: RiskAssessment | null; error?: Error }> {
  try {
    if (!entityId) {
      return { assessment: null, error: new Error('No entity id provided') };
    }

    // Load the real supplier row.
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('org_id, display_name, verification_tier, claim_status, organization_id, capabilities, public_profile')
      .eq('org_id', entityId)
      .maybeSingle();

    if (supplierError) throw supplierError;
    if (!supplier) {
      return { assessment: null, error: new Error('Supplier not found') };
    }

    const s = supplier as unknown as SupplierRow;

    // Best-effort load of the linked organization (defensive: may not exist).
    let org: OrgRow | null = null;
    if (s.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, org_type, status, jurisdiction, override_tier')
        .eq('id', s.organization_id)
        .maybeSingle();
      org = (orgData as unknown as OrgRow) ?? null;
    }

    const supplierFactors = buildSupplierFactors(s, org);
    const rawScore = supplierFactors.reduce((sum, f) => sum + f.weight, 0);
    const risk_score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const overall_risk = getRiskLevel(risk_score);

    // Surface only the factors that actually add risk in the factor lists,
    // but always keep the positive verification note for context.
    const visibleSupplierFactors = supplierFactors.filter(
      (f) => f.weight > 0 || f.description.startsWith('Verified')
    );

    const assessment: RiskAssessment = {
      entity_type: entityType,
      entity_id: entityId,
      overall_risk,
      risk_score,
      supplier_risk_factors: visibleSupplierFactors,
      deal_risk_factors: [],
      market_risk_factors: [],
      recommendations: buildRecommendations(supplierFactors, overall_risk),
      should_flag: risk_score >= 76,
      assessed_at: new Date().toISOString(),
    };

    return { assessment };
  } catch (error) {
    console.error('Error assessing risk:', error);
    return {
      assessment: null,
      error: error instanceof Error ? error : new Error('Unknown error assessing risk'),
    };
  }
}
