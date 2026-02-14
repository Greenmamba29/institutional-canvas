/**
 * Airtable Integration Service
 * Connects to Airtable via Edge Function proxy for FAQ knowledge base and internal marketplace data
 * 
 * SECURITY: API keys are stored server-side in Edge Function secrets, not exposed to client
 */

import { supabase } from '@/integrations/supabase/client';

function escapeAirtableValue(value: string): string {
  return value.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

export interface AirtableFAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  language?: string;
  tags?: string[];
  priority?: number;
}

export interface AirtableProduct {
  id: string;
  name: string;
  type: string; // 'carbonate', 'hydroxide', 'metal', etc.
  grade?: string;
  specifications?: string;
  supplier?: string;
  price_range?: string;
  availability?: string;
  certifications?: string[];
  esg_compliant?: boolean;
}

/**
 * Fetch records from Airtable via Edge Function proxy
 * API keys are stored securely server-side
 */
async function fetchAirtableRecords<T>(
  tableName: string,
  options?: {
    filterByFormula?: string;
    maxRecords?: number;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  }
): Promise<T[]> {
  try {
    const { data, error } = await supabase.functions.invoke('airtable-proxy', {
      body: {
        table: tableName,
        filter: options?.filterByFormula,
        maxRecords: options?.maxRecords,
        sort: options?.sort,
      },
    });

    if (error) {
      console.error('Error calling Airtable proxy:', error);
      return [];
    }

    if (!data?.configured) {
      console.warn('Airtable not configured on server. Returning empty results.');
      return [];
    }

    return (data.records || []).map((record: { id: string; fields: Record<string, unknown> }) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    return [];
  }
}

/**
 * Get all FAQs from Airtable
 */
/**
 * Escape a value for safe use in Airtable filter formulas.
 * Prevents formula injection by escaping single quotes and backslashes.
 */
function escapeAirtableValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export async function getFAQs(options?: {
  category?: string;
  language?: string;
  limit?: number;
}): Promise<AirtableFAQ[]> {
  let filterFormula = '';

  if (options?.category) {
    filterFormula = `{Category} = '${escapeAirtableValue(options.category)}'`;
  }

  if (options?.language) {
    const languageFilter = `{Language} = '${escapeAirtableValue(options.language)}'`;
    filterFormula = filterFormula
      ? `AND(${filterFormula}, ${languageFilter})`
      : languageFilter;
  }

  return fetchAirtableRecords<AirtableFAQ>('FAQs', {
    filterByFormula: filterFormula || undefined,
    maxRecords: options?.limit || 100,
    sort: [
      { field: 'Priority', direction: 'desc' },
      { field: 'Question', direction: 'asc' },
    ],
  });
}

/**
 * Search FAQs by query
 */
export async function searchFAQs(query: string, language: string = 'en'): Promise<AirtableFAQ[]> {
  const faqs = await getFAQs({ language });

  // Client-side filtering for search
  const lowerQuery = query.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery) ||
      faq.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get products from internal marketplace
 */
export async function getMarketplaceProducts(options?: {
  type?: string;
  supplier?: string;
  esgCompliant?: boolean;
  limit?: number;
}): Promise<AirtableProduct[]> {
  let filterFormula = '';

  if (options?.type) {
    filterFormula = `{Type} = '${escapeAirtableValue(options.type)}'`;
  }

  if (options?.supplier) {
    const supplierFilter = `{Supplier} = '${escapeAirtableValue(options.supplier)}'`;
    filterFormula = filterFormula
      ? `AND(${filterFormula}, ${supplierFilter})`
      : supplierFilter;
  }

  if (options?.esgCompliant !== undefined) {
    const esgFilter = `{ESG_Compliant} = ${options.esgCompliant ? '1' : '0'}`;
    filterFormula = filterFormula
      ? `AND(${filterFormula}, ${esgFilter})`
      : esgFilter;
  }

  return fetchAirtableRecords<AirtableProduct>('Products', {
    filterByFormula: filterFormula || undefined,
    maxRecords: options?.limit || 50,
    sort: [{ field: 'Name', direction: 'asc' }],
  });
}

/**
 * Format FAQs for agent knowledge base
 */
export function formatFAQsForAgent(faqs: AirtableFAQ[]): string {
  if (faqs.length === 0) {
    return '';
  }

  const formatted = faqs
    .map((faq, index) => {
      return `**Q${index + 1}: ${faq.question}**\n${faq.answer}`;
    })
    .join('\n\n');

  return `## LithiumBuy Frequently Asked Questions\n\n${formatted}`;
}

/**
 * Format products for agent knowledge base
 */
export function formatProductsForAgent(products: AirtableProduct[]): string {
  if (products.length === 0) {
    return '';
  }

  const formatted = products
    .map((product) => {
      const details = [
        `**${product.name}**`,
        `Type: ${product.type}`,
        product.grade && `Grade: ${product.grade}`,
        product.price_range && `Price Range: ${product.price_range}`,
        product.availability && `Availability: ${product.availability}`,
        product.esg_compliant && `✓ ESG Compliant`,
        product.certifications?.length && `Certifications: ${product.certifications.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');

      return details;
    })
    .join('\n\n');

  return `## Available Products on LithiumBuy Marketplace\n\n${formatted}`;
}

/**
 * Check if Airtable is configured (now always returns true, config is server-side)
 */
export function isAirtableConfigured(): boolean {
  // Configuration is now server-side, so we can't check from client
  // The Edge Function will return configured: false if not set up
  return true;
}

/**
 * Get comprehensive knowledge for agent (FAQs + Products)
 */
export async function getAgentKnowledge(language: string = 'en'): Promise<string> {
  try {
    const [faqs, products] = await Promise.all([
      getFAQs({ language, limit: 20 }),
      getMarketplaceProducts({ limit: 15 }),
    ]);

    const sections = [
      formatFAQsForAgent(faqs),
      formatProductsForAgent(products),
    ].filter(Boolean);

    return sections.join('\n\n---\n\n');
  } catch (error) {
    console.error('Error fetching agent knowledge from Airtable:', error);
    return '';
  }
}
