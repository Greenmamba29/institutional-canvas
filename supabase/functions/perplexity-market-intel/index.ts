import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CATEGORIES = ['price', 'supply', 'demand', 'regulatory', 'technology'] as const;

const CATEGORY_PROMPTS: Record<string, string> = {
  price: 'What are the current lithium carbonate and lithium hydroxide spot prices globally? Include regional differences (China, Chile, Australia). Provide exact USD/tonne figures.',
  supply: 'What is the current global lithium supply situation? Cover production volumes, new mine openings, and supply chain disruptions.',
  demand: 'What is the current lithium demand outlook? Cover EV battery demand, energy storage, and consumer electronics.',
  regulatory: 'What are the latest regulatory developments affecting the lithium market? Cover export restrictions, environmental regulations, and trade policies.',
  technology: 'What are the latest lithium battery technology developments? Cover solid-state batteries, sodium-ion alternatives, and recycling technologies.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Perplexity API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { category = 'price', query } = await req.json();

    if (!CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({ error: `Invalid category. Use: ${CATEGORIES.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = query || CATEGORY_PROMPTS[category];

    const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a lithium market intelligence analyst. Provide concise, data-driven insights with specific numbers and sources. Focus on actionable intelligence for B2B lithium buyers and suppliers.',
          },
          { role: 'user', content: prompt },
        ],
        search_recency_filter: 'week',
      }),
    });

    if (!perplexityRes.ok) {
      const errText = await perplexityRes.text();
      return new Response(JSON.stringify({ error: `Perplexity API error: ${perplexityRes.status}`, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perplexityData = await perplexityRes.json();
    const content = perplexityData.choices?.[0]?.message?.content || '';
    const citations = perplexityData.citations || [];

    // Cache result in Supabase market_news table
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('market_news').insert({
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Intel`,
        content,
        source: 'perplexity',
        category,
        sentiment: 'neutral',
      });
    } catch (cacheError) {
      console.warn('Failed to cache market intel:', cacheError);
    }

    return new Response(JSON.stringify({
      category,
      content,
      citations,
      cached_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
