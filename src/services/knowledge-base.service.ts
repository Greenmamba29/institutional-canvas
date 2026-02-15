// @ts-nocheck
/**
 * Lithium Knowledge Base Service
 * Manages market intelligence, pricing, specifications, and compliance data
 */

import { supabase } from '@/lib/supabase/rpc';

export interface KnowledgeBaseEntry {
  id?: string;
  category: 'pricing' | 'specification' | 'market_intelligence' | 'compliance' | 'supplier_info';
  subcategory?: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  language?: string;
  tags?: string[];
  source?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  relevance: number;
}

/**
 * Search the knowledge base
 */
export async function searchKnowledgeBase(
  query: string,
  options?: {
    categories?: string[];
    language?: string;
    limit?: number;
  }
): Promise<{ data: SearchResult[] | null; error: any }> {
  const { data, error } = await supabase.rpc('search_knowledge_base', {
    p_query: query,
    p_categories: options?.categories || null,
    p_language: options?.language || 'en',
    p_limit: options?.limit || 10,
  });

  return { data, error };
}

/**
 * Get knowledge base entries by category
 */
export async function getKnowledgeByCategory(
  category: string,
  language: string = 'en'
): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from('lithium_knowledge_base')
    .select('*')
    .eq('category', category)
    .eq('language', language)
    .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Add knowledge base entry
 */
export async function addKnowledgeEntry(
  entry: KnowledgeBaseEntry
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('lithium_knowledge_base')
    .insert({
      category: entry.category,
      subcategory: entry.subcategory,
      title: entry.title,
      content: entry.content,
      metadata: entry.metadata || {},
      language: entry.language || 'en',
      tags: entry.tags || [],
      source: entry.source,
      valid_from: entry.valid_from || new Date().toISOString(),
      valid_until: entry.valid_until,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update knowledge base entry
 */
export async function updateKnowledgeEntry(
  id: string,
  updates: Partial<KnowledgeBaseEntry>
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('lithium_knowledge_base')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Get current lithium pricing data
 */
export async function getCurrentPricing(
  product?: string
): Promise<{ data: any[] | null; error: any }> {
  let query = supabase
    .from('lithium_knowledge_base')
    .select('*')
    .eq('category', 'pricing')
    .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
    .order('valid_from', { ascending: false });

  if (product) {
    query = query.contains('tags', [product]);
  }

  const { data, error } = await query.limit(10);
  return { data, error };
}

/**
 * Get product specifications
 */
export async function getProductSpecifications(
  productType: string,
  language: string = 'en'
): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from('lithium_knowledge_base')
    .select('*')
    .eq('category', 'specification')
    .eq('language', language)
    .contains('tags', [productType])
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Get market intelligence
 */
export async function getMarketIntelligence(
  topic?: string,
  language: string = 'en'
): Promise<{ data: any[] | null; error: any }> {
  let query = supabase
    .from('lithium_knowledge_base')
    .select('*')
    .eq('category', 'market_intelligence')
    .eq('language', language)
    .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString());

  if (topic) {
    query = query.or(`title.ilike.%${topic}%,content.ilike.%${topic}%`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(20);

  return { data, error };
}

/**
 * Get compliance information
 */
export async function getComplianceInfo(
  region?: string,
  language: string = 'en'
): Promise<{ data: any[] | null; error: any }> {
  let query = supabase
    .from('lithium_knowledge_base')
    .select('*')
    .eq('category', 'compliance')
    .eq('language', language)
    .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString());

  if (region) {
    query = query.contains('tags', [region]);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Seed initial knowledge base with essential data
 */
export async function seedKnowledgeBase(): Promise<void> {
  const initialData: KnowledgeBaseEntry[] = [
    // Pricing data
    {
      category: 'pricing',
      title: 'Lithium Carbonate - Battery Grade Q1 2025',
      content: 'Battery-grade lithium carbonate (99.5%+ purity) trading range: $11,500-$12,200 per metric ton (Asia spot market). Prices have stabilized after Q4 2024 volatility. European markets showing 5-8% premium due to supply chain diversification efforts.',
      tags: ['lithium_carbonate', 'battery_grade', '2025', 'pricing'],
      metadata: { min_price: 11500, max_price: 12200, currency: 'USD', unit: 'metric_ton', region: 'Asia' },
    },
    {
      category: 'pricing',
      title: 'Lithium Hydroxide - Monohydrate Q1 2025',
      content: 'Lithium hydroxide monohydrate (battery grade) current pricing: $13,800-$14,500 per metric ton. Strong demand from EV manufacturers driving sustained pricing. Premium quality (low-iron content) commanding 8-12% price premium.',
      tags: ['lithium_hydroxide', 'monohydrate', '2025', 'pricing'],
      metadata: { min_price: 13800, max_price: 14500, currency: 'USD', unit: 'metric_ton' },
    },

    // Specifications
    {
      category: 'specification',
      title: 'Battery Grade Lithium Carbonate Specifications',
      content: 'Li2CO3 content: ≥99.5%\nTotal impurities: ≤0.5%\nMagnesia (MgO): ≤0.02%\nCalcium (Ca): ≤0.04%\nSulfate (SO4): ≤0.05%\nIron (Fe): ≤0.0015%\nChloride (Cl): ≤0.005%\nParticle size: D50 8-12 μm\nMoisture: ≤0.2%',
      tags: ['lithium_carbonate', 'battery_grade', 'specifications'],
      metadata: { grade: 'battery_grade', purity: 99.5 },
    },
    {
      category: 'specification',
      title: 'Lithium Hydroxide Monohydrate Technical Specs',
      content: 'LiOH·H2O content: ≥56.5%\nLiOH content: ≥51%\nSodium (Na): ≤0.002%\nPotassium (K): ≤0.002%\nCalcium (Ca): ≤0.003%\nIron (Fe): ≤0.0005%\nMagnesia (MgO): ≤0.002%\nSulfate (SO4): ≤0.01%\nChloride (Cl): ≤0.003%',
      tags: ['lithium_hydroxide', 'monohydrate', 'specifications'],
      metadata: { grade: 'battery_grade', form: 'monohydrate' },
    },

    // Market Intelligence
    {
      category: 'market_intelligence',
      title: 'EU Battery Passport Requirements 2026',
      content: 'Starting February 2026, all batteries >2 kWh sold in EU require digital battery passports. ESG-compliant lithium suppliers showing 25-35% price premium. Carbon footprint tracking mandatory. Expect increased demand for certified sustainable lithium sources.',
      tags: ['EU', 'compliance', 'battery_passport', '2026', 'ESG'],
      metadata: { region: 'EU', effective_date: '2026-02-01', impact: 'high' },
      valid_from: new Date().toISOString(),
      valid_until: '2026-12-31',
    },
    {
      category: 'market_intelligence',
      title: 'Global Lithium Supply Outlook 2025-2027',
      content: 'Australia remains dominant producer (52% global supply). New capacity coming online in Argentina (Salar de Atacama expansion +35kt LCE) and Chile (SQM expansion +20kt). Chinese refiners consolidating market share. Expect supply-demand equilibrium by Q3 2026.',
      tags: ['supply', 'outlook', 'forecast', '2025'],
      metadata: { timeframe: '2025-2027', confidence: 'high' },
    },

    // Compliance
    {
      category: 'compliance',
      title: 'US IRA Critical Minerals Requirements',
      content: 'Inflation Reduction Act (IRA) battery component requirements: 50% critical minerals from US/FTA countries (2024), increasing to 80% by 2027. Lithium qualifies as critical mineral. Free trade agreements include Australia, Chile, Canada, Mexico.',
      tags: ['US', 'IRA', 'compliance', 'FTA'],
      metadata: { region: 'US', law: 'IRA', effective_date: '2023-01-01' },
    },
  ];

  // Insert entries (ignore duplicates)
  for (const entry of initialData) {
    try {
      await addKnowledgeEntry(entry);
    } catch (error) {
      console.warn('Knowledge base entry already exists or insert failed:', entry.title);
    }
  }
}
