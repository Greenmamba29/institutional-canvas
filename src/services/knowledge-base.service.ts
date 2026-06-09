/**
 * Lithium Knowledge Base Service
 * Provides market intelligence, pricing, specifications, and compliance data.
 *
 * Data source: real Airtable knowledge tables, read via the secure `airtable-proxy`
 * edge function (API keys stay server-side). There is no single "knowledge base"
 * table in Airtable; instead the relevant knowledge is spread across several real
 * tables which we map onto the KnowledgeBaseEntry categories:
 *
 *   pricing              -> "Market Prices"
 *   specification        -> "Product Catalog"
 *   market_intelligence  -> "Market News" + "Market Briefings"
 *   compliance           -> "Compliance Checks"
 *
 * If a table or the Airtable integration is not configured server-side, the proxy
 * returns an empty (real) result and these functions surface that empty result —
 * never mock data.
 */

import { supabase } from '@/integrations/supabase/client';

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

type AirtableRecord = { id: string; fields: Record<string, unknown> };

// Map our logical categories to the real Airtable tables that back them.
const CATEGORY_TABLES: Record<KnowledgeBaseEntry['category'], string[]> = {
  pricing: ['Market Prices'],
  specification: ['Product Catalog'],
  market_intelligence: ['Market News', 'Market Briefings'],
  compliance: ['Compliance Checks'],
  supplier_info: [],
};

// Simple in-memory cache (mirrors the caching intent of the codebase: avoid
// hammering the proxy for repeated reads within a session).
const CACHE_TTL_MS = 5 * 60 * 1000;
const tableCache = new Map<string, { ts: number; entries: KnowledgeBaseEntry[] }>();

/**
 * Fetch raw records from an Airtable table through the secure edge-function proxy.
 * Returns [] on any error or when Airtable is not configured (real empty result).
 */
async function fetchTableRecords(table: string, maxRecords = 100): Promise<AirtableRecord[]> {
  try {
    const { data, error } = await supabase.functions.invoke('airtable-proxy', {
      body: { table, maxRecords },
    });
    if (error) {
      console.error(`[knowledge-base] Error calling airtable-proxy for ${table}:`, error);
      return [];
    }
    if (!data?.configured) {
      console.warn('[knowledge-base] Airtable not configured server-side. Returning empty results.');
      return [];
    }
    return (data.records || []) as AirtableRecord[];
  } catch (err) {
    console.error(`[knowledge-base] Error fetching table ${table}:`, err);
    return [];
  }
}

function str(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(str).filter(Boolean).join(', ');
  if (typeof value === 'object') return String((value as { name?: unknown }).name ?? '');
  return String(value);
}

function num(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value);
}

/**
 * Map a raw Airtable record from a specific table into a KnowledgeBaseEntry.
 */
function mapRecord(table: string, rec: AirtableRecord): KnowledgeBaseEntry {
  const f = rec.fields;

  switch (table) {
    case 'Market Prices': {
      const product = str(f['product_type']);
      const purity = str(f['purity']);
      const region = str(f['region']);
      const price = num(f['price_usd']);
      const change = num(f['price_change_24h']);
      const trend = str(f['market_trend']);
      const note = str(f['price_note']);
      const titleParts = [product, purity && `(${purity})`, region && `- ${region}`].filter(Boolean);
      const contentParts = [
        price && `Price: $${price}/MT`,
        change && `24h change: ${change}`,
        trend && `Trend: ${trend}`,
        note,
      ].filter(Boolean);
      return {
        id: rec.id,
        category: 'pricing',
        title: titleParts.join(' ') || 'Market Price',
        content: contentParts.join('. '),
        source: str(f['source']) || 'Airtable: Market Prices',
        valid_from: str(f['price_last_updated']) || undefined,
        tags: [product, purity, region].map((t) => t.toLowerCase()).filter(Boolean),
        metadata: { ...f },
        language: 'en',
      };
    }

    case 'Product Catalog': {
      const name = str(f['Product Name']);
      const grade = str(f['Grade/Purity']);
      const form = str(f['Form']);
      const cas = str(f['CAS Number']);
      const hs = str(f['HS Code']);
      const desc = str(f['Description']);
      const reach = f['REACH Compliant'] ? 'REACH compliant' : '';
      const rohs = f['RoHS Compliant'] ? 'RoHS compliant' : '';
      const contentParts = [
        grade && `Grade/Purity: ${grade}`,
        form && `Form: ${form}`,
        cas && `CAS: ${cas}`,
        hs && `HS Code: ${hs}`,
        reach,
        rohs,
        desc,
      ].filter(Boolean);
      return {
        id: rec.id,
        category: 'specification',
        title: name || 'Product Specification',
        content: contentParts.join('. '),
        source: 'Airtable: Product Catalog',
        tags: [name, grade, form, str(f['Category'])].map((t) => t.toLowerCase()).filter(Boolean),
        metadata: { ...f },
        language: 'en',
      };
    }

    case 'Market News': {
      const title = str(f['title']);
      const summary = str(f['summary']);
      const sentiment = str(f['sentiment']);
      const category = str(f['category']);
      const research = str(f['external_research_note']);
      return {
        id: rec.id,
        category: 'market_intelligence',
        subcategory: 'news',
        title: title || 'Market News',
        content: [summary, research, sentiment && `Sentiment: ${sentiment}`].filter(Boolean).join('. '),
        source: str(f['source']) || str(f['url']) || 'Airtable: Market News',
        valid_from: str(f['date_published']) || undefined,
        tags: [category, sentiment].map((t) => t.toLowerCase()).filter(Boolean),
        metadata: { ...f },
        language: 'en',
      };
    }

    case 'Market Briefings': {
      const summary = str(f['executive_summary']);
      const highlights = str(f['key_highlights']);
      const outlook = str(f['price_outlook']);
      const rec_summary = str(f['recommendation_summary']);
      const date = str(f['briefing_date']);
      return {
        id: rec.id,
        category: 'market_intelligence',
        subcategory: 'briefing',
        title: `Market Briefing${date ? ` - ${date.slice(0, 10)}` : ''}`,
        content: [summary, highlights, outlook && `Price outlook: ${outlook}`, rec_summary]
          .filter(Boolean)
          .join('\n\n'),
        source: str(f['prepared_by']) || 'Airtable: Market Briefings',
        valid_from: date || undefined,
        tags: ['briefing', 'market'],
        metadata: { ...f },
        language: 'en',
      };
    }

    case 'Compliance Checks': {
      const name = str(f['Check Name']);
      const type = str(f['Type of Check']);
      const result = str(f['Result']);
      const framework = str(f['Regulatory Framework']);
      const findings = str(f['Findings Summary']);
      const notes = str(f['Notes']);
      const riskLevel = str(f['Risk Level']);
      return {
        id: rec.id,
        category: 'compliance',
        subcategory: type || undefined,
        title: name || 'Compliance Check',
        content: [
          type && `Type: ${type}`,
          result && `Result: ${result}`,
          riskLevel && `Risk: ${riskLevel}`,
          framework && `Framework: ${framework}`,
          findings,
          notes,
        ]
          .filter(Boolean)
          .join('. '),
        source: 'Airtable: Compliance Checks',
        valid_from: str(f['Check Date']) || undefined,
        valid_until: str(f['Expiry Date']) || undefined,
        tags: [type, riskLevel, framework].map((t) => t.toLowerCase()).filter(Boolean),
        metadata: { ...f },
        language: 'en',
      };
    }

    default:
      return {
        id: rec.id,
        category: 'supplier_info',
        title: str(f['Name'] ?? f['title'] ?? f['Title']) || table,
        content: '',
        source: `Airtable: ${table}`,
        metadata: { ...f },
        language: 'en',
      };
  }
}

/**
 * Load (and cache) all knowledge entries for a logical category from its backing
 * Airtable table(s). Returns a real (possibly empty) array — never mock data.
 */
async function loadCategory(category: KnowledgeBaseEntry['category']): Promise<KnowledgeBaseEntry[]> {
  const tables = CATEGORY_TABLES[category] || [];
  const collected: KnowledgeBaseEntry[] = [];

  for (const table of tables) {
    const cached = tableCache.get(table);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      collected.push(...cached.entries);
      continue;
    }
    const records = await fetchTableRecords(table);
    const entries = records.map((r) => mapRecord(table, r));
    tableCache.set(table, { ts: Date.now(), entries });
    collected.push(...entries);
  }

  return collected;
}

async function loadAll(): Promise<KnowledgeBaseEntry[]> {
  const categories = Object.keys(CATEGORY_TABLES) as KnowledgeBaseEntry['category'][];
  const results = await Promise.all(categories.map((c) => loadCategory(c)));
  return results.flat();
}

/**
 * Search the knowledge base across all real Airtable-backed categories.
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

    const all = await loadAll();

    const results = all
      .filter((entry) => {
        if (entry.language && entry.language !== language) return false;
        if (options?.categories && !options.categories.includes(entry.category)) return false;
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
 * Get knowledge base entries by category from the real Airtable source.
 */
export async function getKnowledgeByCategory(
  category: string,
  language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const known = (Object.keys(CATEGORY_TABLES) as KnowledgeBaseEntry['category'][]).includes(
      category as KnowledgeBaseEntry['category']
    );
    if (!known) return { data: [], error: null };
    const entries = await loadCategory(category as KnowledgeBaseEntry['category']);
    const filtered = entries.filter((e) => !e.language || e.language === language);
    return { data: filtered, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Add knowledge base entry.
 *
 * Knowledge tables in Airtable are managed operationally (via the Airtable CRM
 * layer and sync edge functions), not written from the client through the
 * read-only proxy. Writes are intentionally not supported here.
 */
export async function addKnowledgeEntry(
  _entry: KnowledgeBaseEntry
): Promise<{ data: KnowledgeBaseEntry | null; error: Error | null }> {
  return {
    data: null,
    error: new Error(
      'addKnowledgeEntry is not supported: knowledge tables are managed in Airtable and synced server-side.'
    ),
  };
}

/**
 * Update knowledge base entry. See addKnowledgeEntry — writes are not supported
 * through the read-only Airtable proxy.
 */
export async function updateKnowledgeEntry(
  _id: string,
  _updates: Partial<KnowledgeBaseEntry>
): Promise<{ data: KnowledgeBaseEntry | null; error: Error | null }> {
  return {
    data: null,
    error: new Error(
      'updateKnowledgeEntry is not supported: knowledge tables are managed in Airtable and synced server-side.'
    ),
  };
}

/**
 * Get current lithium pricing data from the real "Market Prices" Airtable table.
 */
export async function getCurrentPricing(
  product?: string
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const entries = await loadCategory('pricing');
    const filtered = product
      ? entries.filter((e) => {
          const p = product.toLowerCase();
          return (
            e.title.toLowerCase().includes(p) ||
            e.content.toLowerCase().includes(p) ||
            e.tags?.some((t) => t.includes(p))
          );
        })
      : entries;
    return { data: filtered, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get product specifications from the real "Product Catalog" Airtable table.
 */
export async function getProductSpecifications(
  productType: string,
  language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const entries = await loadCategory('specification');
    const p = productType.toLowerCase();
    const filtered = entries.filter(
      (e) =>
        (!e.language || e.language === language) &&
        (!productType ||
          e.title.toLowerCase().includes(p) ||
          e.content.toLowerCase().includes(p) ||
          e.tags?.some((t) => t.includes(p)))
    );
    return { data: filtered, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get market intelligence from the real "Market News" + "Market Briefings" tables.
 */
export async function getMarketIntelligence(
  topic?: string,
  language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const entries = await loadCategory('market_intelligence');
    const filtered = entries.filter((e) => {
      if (e.language && e.language !== language) return false;
      if (!topic) return true;
      const t = topic.toLowerCase();
      return (
        e.title.toLowerCase().includes(t) ||
        e.content.toLowerCase().includes(t) ||
        e.tags?.some((tag) => tag.includes(t))
      );
    });
    return { data: filtered, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get compliance information from the real "Compliance Checks" Airtable table.
 */
export async function getComplianceInfo(
  region?: string,
  language: string = 'en'
): Promise<{ data: KnowledgeBaseEntry[] | null; error: Error | null }> {
  try {
    const entries = await loadCategory('compliance');
    const filtered = entries.filter((e) => {
      if (e.language && e.language !== language) return false;
      if (!region) return true;
      const r = region.toLowerCase();
      return (
        e.title.toLowerCase().includes(r) ||
        e.content.toLowerCase().includes(r) ||
        e.tags?.some((tag) => tag.includes(r))
      );
    });
    return { data: filtered, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Seeding is not applicable: knowledge lives in Airtable and is managed there.
 * Kept for API compatibility; clears the local read cache so the next read is fresh.
 */
export async function seedKnowledgeBase(): Promise<void> {
  tableCache.clear();
}
