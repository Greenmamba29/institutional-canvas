import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { table, filter, maxRecords, sort } = await req.json();

    if (!table) {
      return new Response(
        JSON.stringify({ error: 'table is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Airtable is configured
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.log('[airtable-proxy] Airtable not configured, returning empty records');
      return new Response(
        JSON.stringify({ records: [], configured: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (filter) params.append('filterByFormula', filter);
    if (maxRecords) params.append('maxRecords', maxRecords.toString());
    if (sort && Array.isArray(sort)) {
      sort.forEach((s: { field: string; direction: string }, i: number) => {
        params.append(`sort[${i}][field]`, s.field);
        params.append(`sort[${i}][direction]`, s.direction);
      });
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}${
      params.toString() ? '?' + params.toString() : ''
    }`;

    console.log(`[airtable-proxy] Fetching from table: ${table}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[airtable-proxy] Airtable API error: ${response.status} - ${errorText}`);
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[airtable-proxy] Retrieved ${data.records?.length || 0} records from ${table}`);

    return new Response(
      JSON.stringify({ records: data.records, configured: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[airtable-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
