/**
 * Lithium Knowledge Base Service
 * Manages market intelligence, pricing, specifications, and compliance data
 * 
 * NOTE: This service uses mock implementations since the required database table
 * (lithium_knowledge_base) is not yet created in the Supabase schema.
 */

export interface KnowledgeBaseEntry {
  id?: string;
  category: 'pricing' | 'specification' | 'market_intelligence' | 'compliance' | 'supplier_info';
  subcategory?: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
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

// Mock knowledge base data for development
const MOCK_KNOWLEDGE: KnowledgeBaseEntry[] = [
  {
    id: '1',
    category: 'pricing',
    title: 'Lithium Carbonate - Battery Grade Q1 2025',
    content: 'Battery-grade lithium carbonate (99.5%+ purity) trading range: $11,500-$12,200 per metric ton (Asia spot market).',
    tags: ['lithium_carbonate', 'battery_grade', '2025', 'pricing'],
    language: 'en',
  },
  {
    id: '2',
    category: 'pricing',
    title: 'Lithium Hydroxide - Monohydrate Q1 2025',
    content: 'Lithium hydroxide monohydrate (battery grade) current pricing: $13,800-$14,500 per metric ton.',
    tags: ['lithium_hydroxide', 'monohydrate', '2025', 'pricing'],
    language: 'en',
  },
  {
    id: '3',
    category: 'specification',
    title: 'Battery Grade Lithium Carbonate Specifications',
    content: 'Li2CO3 content: ≥99.5%, Total impurities: ≤0.5%, Iron (Fe): ≤0.0015%',
    tags: ['lithium_carbonate', 'battery_grade', 'specifications'],
    language: 'en',
  },
  {
    id: '4',
    category: 'market_intelligence',
    title: 'EU Battery Passport Requirements 2026',
    content: 'Starting February 2026, all batteries >2 kWh sold in EU require digital battery passports. ESG-compliant lithium suppliers showing 25-35% price premium.',
    tags: ['EU', 'compliance', 'battery_passport', '2026', 'ESG'],
    language: 'en',
  },
];

/**
 * Search the knowledge base (mock implementation)
 */
export async function searchKnowledgeBase(
  query: string,
  options?: {
    categories?: string[];
    language?: string;
    limit?: number;
  }
): Promise<{ data: SearchResult[] | null; error: Error | null }> {
  try {
    const lowerQuery = query.toLowerCase();
    const language = options?.language || 'en';
    const limit = options?.limit || 10;
    
    const results = MOCK_KNOWLEDGE
      .filter((entry) => {
        // Filter by language
        if (entry.language && entry.language !== language) return false;
        
        // Filter by category
        if (options?.categories && !options.categories.includes(entry.category)) return false;
        
        // Search in title and content
        return (
          entry.title.toLowerCase().includes(lowerQuery) ||
          entry.content.toLowerCase().includes(lowerQuery) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      })
      .slice(0, limit)
      .map((entry, index) => ({
        id: entry.id || String(index),
        title: entry.title,
        content: entry.content,
        category: entry.category,
        relevance: 1 - index * 0.1,
      }));
    
    return { data: results, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get knowledge base entries by category (mock implementation)
 */
export async function getKnowledgeByCategory(
  category: string,
  language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const results = MOCK_KNOWLEDGE.filter(
      (entry) => entry.category === category && (!entry.language || entry.language === language)
    );
    return { data: results, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Add knowledge base entry (mock implementation - logs only)
 */
export async function addKnowledgeEntry(
  entry: KnowledgeBaseEntry
): Promise<{ data: KnowledgeBaseEntry | null; error: Error | null }> {
  try {
    console.log('Adding knowledge entry (mock):', entry.title);
    const newEntry = {
      ...entry,
      id: `mock_${Date.now()}`,
    };
    return { data: newEntry, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update knowledge base entry (mock implementation)
 */
export async function updateKnowledgeEntry(
  id: string,
  updates: Partial<KnowledgeBaseEntry>
): Promise<{ data: KnowledgeBaseEntry | null; error: Error | null }> {
  try {
    console.log('Updating knowledge entry (mock):', id, updates);
    return { data: { id, ...updates } as KnowledgeBaseEntry, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get current lithium pricing data (mock implementation)
 */
export async function getCurrentPricing(
  product?: string
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const pricingData = MOCK_KNOWLEDGE.filter((entry) => {
      if (entry.category !== 'pricing') return false;
      if (product && !entry.tags?.includes(product)) return false;
      return true;
    });
    return { data: pricingData, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get product specifications (mock implementation)
 */
export async function getProductSpecifications(
  productType: string,
  _language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const specs = MOCK_KNOWLEDGE.filter(
      (entry) => entry.category === 'specification' && entry.tags?.includes(productType)
    );
    return { data: specs, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get market intelligence (mock implementation)
 */
export async function getMarketIntelligence(
  topic?: string,
  _language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const intel = MOCK_KNOWLEDGE.filter((entry) => {
      if (entry.category !== 'market_intelligence') return false;
      if (topic && !entry.title.toLowerCase().includes(topic.toLowerCase())) return false;
      return true;
    });
    return { data: intel, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get compliance information (mock implementation)
 */
export async function getComplianceInfo(
  region?: string,
  _language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const compliance = MOCK_KNOWLEDGE.filter((entry) => {
      if (entry.category !== 'compliance' && !entry.tags?.includes('compliance')) return false;
      if (region && !entry.tags?.includes(region)) return false;
      return true;
    });
    return { data: compliance, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Seed initial knowledge base with essential data (mock - logs only)
 */
export async function seedKnowledgeBase(): Promise<void> {
  console.log('Seeding knowledge base (mock) - data is already loaded in memory');
}
