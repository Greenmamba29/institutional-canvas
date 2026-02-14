/**
 * Perplexity Market Intelligence Edge Function
 *
 * Powers live market intelligence for LithiumBuy by calling the Perplexity API
 * for real-time lithium market data, storing results in Supabase, and optionally
 * syncing to Airtable.
 *
 * POST body: { query: string, category: 'price' | 'news' | 'auction' | 'company', subscription_tier: 'free' | 'pro' | 'enterprise' }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Airtable table ID for market intelligence (configurable via env)
const AIRTABLE_MARKET_INTEL_TABLE = Deno.env.get('AIRTABLE_MARKET_INTEL_TABLE') || 'Market_Intelligence';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = 'price' | 'news' | 'auction' | 'company';
type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface MarketIntelRequest {
  query: string;
  category: Category;
  subscription_tier: SubscriptionTier;
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CATEGORIES: Category[] = ['price', 'news', 'auction', 'company'];
const VALID_TIERS: SubscriptionTier[] = ['free', 'pro', 'enterprise'];
const FREE_TIER_DAILY_LIMIT = 3;

// ---------------------------------------------------------------------------
// System prompts scoped to lithium market intelligence
// ---------------------------------------------------------------------------

const SYSTEM_PROMPTS: Record<Category, string> = {
  price: `You are a lithium market pricing analyst. Provide current lithium commodity prices including lithium carbonate, lithium hydroxide, and spodumene concentrate. Include regional price variations (Asia, Europe, Americas, Australia), price trends over the past week, and confidence levels. Format prices in USD per metric ton. Focus exclusively on lithium and related battery materials pricing data.`,

  news: `You are a lithium industry news analyst. Provide the latest news and developments in the lithium market, including supply chain updates, regulatory changes, new mine openings or closures, EV industry demand signals, and geopolitical factors affecting lithium supply. Focus exclusively on lithium, battery materials, and directly related industries. Summarize each item with a sentiment indicator (positive, negative, or neutral for the lithium market).`,

  auction: `You are a lithium auction and trading analyst. Provide information about recent and upcoming lithium auctions, spot market activity, contract negotiations, and trading volumes. Include details about auction platforms, lot sizes, grade specifications, and price outcomes. Focus exclusively on lithium and battery-grade material auctions and trading activity.`,

  company: `You are a lithium industry company intelligence analyst. Provide intelligence on key lithium producers, processors, and battery manufacturers. Include information about company financials, production volumes, expansion plans, partnerships, M&A activity, and market positioning. Focus exclusively on companies involved in the lithium and battery materials supply chain.`,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Check rate limit for free tier users by counting today's entries
 * in the market_briefings-adjacent query log. We use the webhook_events
 * table to track per-day calls keyed on source + event_type.
 */
async function checkFreeTierRateLimit(
  supabase: ReturnType<typeof createClient>,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('webhook_events')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'perplexity-market-intel')
    .eq('event_type', 'free_tier_query')
    .gte('processed_at', todayStart.toISOString());

  if (error) {
    console.error('[perplexity-market-intel] Rate limit check error:', error);
    // Fail open -- allow the request but log the error
    return { allowed: true, used: 0, limit: FREE_TIER_DAILY_LIMIT };
  }

  const used = count ?? 0;
  return {
    allowed: used < FREE_TIER_DAILY_LIMIT,
    used,
    limit: FREE_TIER_DAILY_LIMIT,
  };
}

/**
 * Record a free-tier usage event for rate limiting.
 */
async function recordFreeTierUsage(
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  await supabase.from('webhook_events').insert({
    event_type: 'free_tier_query',
    source: 'perplexity-market-intel',
    payload: { timestamp: new Date().toISOString() },
    status: 'success',
  });
}

/**
 * Call the Perplexity API with a lithium-scoped system prompt.
 */
async function callPerplexity(
  query: string,
  category: Category,
): Promise<PerplexityResponse> {
  const messages: PerplexityMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS[category] },
    { role: 'user', content: query },
  ];

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[perplexity-market-intel] Perplexity API error: ${response.status} - ${errorText}`);
    throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
  }

  return await response.json() as PerplexityResponse;
}

/**
 * Derive a table name to store the result based on category.
 * - price  -> market_prices  (but we store the raw intel in market_news as a general store)
 * - news   -> market_news
 * - auction / company -> market_news (with category tag)
 *
 * We also always log the full query + response into market_briefings as a
 * dated intelligence record.
 */
async function storeInDatabase(
  supabase: ReturnType<typeof createClient>,
  query: string,
  category: Category,
  content: string,
  citations: string[] | undefined,
): Promise<{ id: string }> {
  // Store as a market_news entry so it shows up in the intelligence feed
  const { data: newsRow, error: newsError } = await supabase
    .from('market_news')
    .insert({
      title: `[${category.toUpperCase()}] ${query.slice(0, 120)}`,
      summary: content.slice(0, 2000),
      source: 'perplexity',
      url: citations?.[0] ?? null,
      sentiment: 'neutral',
      sentiment_score: 0,
      category,
    })
    .select('id')
    .single();

  if (newsError) {
    console.error('[perplexity-market-intel] DB insert error (market_news):', newsError);
    throw newsError;
  }

  // Also log to webhook_events for auditability
  await supabase.from('webhook_events').insert({
    event_type: 'perplexity_query',
    source: 'perplexity-market-intel',
    payload: {
      query,
      category,
      content_length: content.length,
      citations,
      record_id: newsRow.id,
      timestamp: new Date().toISOString(),
    },
    status: 'success',
  });

  return { id: newsRow.id };
}

/**
 * Fetch cached/recent data from market_news for the given category.
 * Used as a fallback when the Perplexity API key is unavailable.
 */
async function getCachedData(
  supabase: ReturnType<typeof createClient>,
  category: Category,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('market_news')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[perplexity-market-intel] Cache fetch error:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Sync the intelligence result to Airtable's Market_Intelligence table.
 */
async function syncToAirtable(
  query: string,
  category: Category,
  content: string,
  citations: string[] | undefined,
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.log('[perplexity-market-intel] Airtable not configured, skipping sync');
    return false;
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_MARKET_INTEL_TABLE)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              'Query': query,
              'Category': category,
              'Response': content.slice(0, 100000), // Airtable long text limit
              'Citations': (citations ?? []).join('\n'),
              'Source': 'perplexity',
              'Timestamp': new Date().toISOString(),
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[perplexity-market-intel] Airtable sync error: ${response.status} - ${errorText}`);
      return false;
    }

    console.log('[perplexity-market-intel] Successfully synced to Airtable');
    return true;
  } catch (err) {
    console.error('[perplexity-market-intel] Airtable sync exception:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    // -----------------------------------------------------------------------
    // 1. Parse and validate request
    // -----------------------------------------------------------------------
    const body: MarketIntelRequest = await req.json();
    const { query, category, subscription_tier } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty "query" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({
          error: `Invalid "category". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!subscription_tier || !VALID_TIERS.includes(subscription_tier)) {
      return new Response(
        JSON.stringify({
          error: `Invalid "subscription_tier". Must be one of: ${VALID_TIERS.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // -----------------------------------------------------------------------
    // 2. Enforce subscription tier restrictions
    // -----------------------------------------------------------------------

    // Free tier can only access 'price' category
    if (subscription_tier === 'free' && category !== 'price') {
      return new Response(
        JSON.stringify({
          error: 'Free tier only supports the "price" category. Upgrade to Pro or Enterprise for full access.',
          allowed_categories: ['price'],
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // -----------------------------------------------------------------------
    // 3. Initialize Supabase client
    // -----------------------------------------------------------------------
    const supabase = buildSupabaseClient();

    // -----------------------------------------------------------------------
    // 4. Rate limiting for free tier
    // -----------------------------------------------------------------------
    let rateLimitHeaders: Record<string, string> = {};

    if (subscription_tier === 'free') {
      const rateCheck = await checkFreeTierRateLimit(supabase);

      rateLimitHeaders = {
        'X-RateLimit-Limit': String(rateCheck.limit),
        'X-RateLimit-Remaining': String(Math.max(0, rateCheck.limit - rateCheck.used - 1)),
        'X-RateLimit-Reset': (() => {
          const tomorrow = new Date();
          tomorrow.setUTCHours(24, 0, 0, 0);
          return tomorrow.toISOString();
        })(),
      };

      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Free tier daily limit reached. Upgrade to Pro for unlimited queries.',
            limit: rateCheck.limit,
            used: rateCheck.used,
            resets_at: rateLimitHeaders['X-RateLimit-Reset'],
          }),
          {
            status: 429,
            headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // -----------------------------------------------------------------------
    // 5. Call Perplexity API (or fall back to cached data)
    // -----------------------------------------------------------------------
    let content: string;
    let citations: string[] | undefined;
    let rawApiResponse: PerplexityResponse | undefined;
    let fromCache = false;

    if (!PERPLEXITY_API_KEY) {
      console.log('[perplexity-market-intel] Perplexity API key not configured, returning cached data');

      const cachedData = await getCachedData(supabase, category);

      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          message: 'Perplexity API key not configured. Returning cached market data.',
          data: cachedData,
          category,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    try {
      const perplexityResponse = await callPerplexity(query, category);
      content = perplexityResponse.choices?.[0]?.message?.content ?? '';
      citations = perplexityResponse.citations;
      rawApiResponse = perplexityResponse;

      if (!content) {
        throw new Error('Empty response from Perplexity API');
      }
    } catch (apiError) {
      console.error('[perplexity-market-intel] Perplexity API call failed, falling back to cache:', apiError);

      const cachedData = await getCachedData(supabase, category);

      if (cachedData.length > 0) {
        fromCache = true;
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            message: 'Perplexity API temporarily unavailable. Returning cached market data.',
            data: cachedData,
            category,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // No cache available either -- propagate the error
      throw apiError;
    }

    // -----------------------------------------------------------------------
    // 6. Store response in database
    // -----------------------------------------------------------------------
    const { id: recordId } = await storeInDatabase(supabase, query, category, content, citations);

    // Record free-tier usage for rate limiting
    if (subscription_tier === 'free') {
      await recordFreeTierUsage(supabase);
    }

    // -----------------------------------------------------------------------
    // 7. Optionally sync to Airtable
    // -----------------------------------------------------------------------
    const airtableSynced = await syncToAirtable(query, category, content, citations);

    // -----------------------------------------------------------------------
    // 8. Build and return response
    // -----------------------------------------------------------------------
    const responseBody: Record<string, unknown> = {
      success: true,
      cached: fromCache,
      record_id: recordId,
      category,
      query,
      content,
      citations: citations ?? [],
      airtable_synced: airtableSynced,
      timestamp: new Date().toISOString(),
    };

    // Enterprise tier gets the raw API response for custom processing
    if (subscription_tier === 'enterprise' && rawApiResponse) {
      responseBody.raw_api_response = rawApiResponse;
    }

    console.log(`[perplexity-market-intel] Success: category=${category}, tier=${subscription_tier}, record=${recordId}`);

    return new Response(
      JSON.stringify(responseBody),
      {
        status: 200,
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[perplexity-market-intel] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
