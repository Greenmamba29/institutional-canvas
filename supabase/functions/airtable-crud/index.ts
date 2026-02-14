import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function escapeAirtableValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const ALLOWED_TABLES = ['Market_Intelligence', 'Auction_Companies', 'Auction_Contacts', 'FAQs', 'Products'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('AIRTABLE_API_KEY');
    const baseId = Deno.env.get('AIRTABLE_BASE_ID');

    if (!apiKey || !baseId) {
      return new Response(JSON.stringify({ configured: false, error: 'Airtable not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { table, action = 'list', filter, maxRecords, sort, record, recordId } = await req.json();

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: `Table not allowed. Allowed: ${ALLOWED_TABLES.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const airtableBase = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    let response: Response;

    switch (action) {
      case 'list': {
        const params = new URLSearchParams();
        if (filter) params.set('filterByFormula', filter);
        if (maxRecords) params.set('maxRecords', String(maxRecords));
        if (sort?.length) {
          sort.forEach((s: { field: string; direction: string }, i: number) => {
            params.set(`sort[${i}][field]`, s.field);
            params.set(`sort[${i}][direction]`, s.direction);
          });
        }
        response = await fetch(`${airtableBase}?${params}`, { headers });
        break;
      }
      case 'create': {
        if (!record) throw new Error('record is required for create');
        response = await fetch(airtableBase, {
          method: 'POST',
          headers,
          body: JSON.stringify({ records: [{ fields: record }] }),
        });
        break;
      }
      case 'update': {
        if (!recordId || !record) throw new Error('recordId and record are required for update');
        response = await fetch(`${airtableBase}/${recordId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ fields: record }),
        });
        break;
      }
      case 'delete': {
        if (!recordId) throw new Error('recordId is required for delete');
        response = await fetch(`${airtableBase}/${recordId}`, {
          method: 'DELETE',
          headers,
        });
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const data = await response.json();

    return new Response(JSON.stringify({ configured: true, ...data }), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
