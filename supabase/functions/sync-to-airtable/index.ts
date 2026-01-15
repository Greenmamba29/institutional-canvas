import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID') || 'appu9fRT4qFBCf8wL';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const tableMapping: Record<string, string> = {
  'subscriptions': 'tblCQa00kVDzzIchQ',
  'subscription_plans': 'tblyoqlubNtFyLgG3',
  'payments': 'tblQsm36zVYUo4wAA',
};

interface SyncRequest {
  table: string;
  record: Record<string, any>;
  action?: 'create' | 'update' | 'delete';
  recordId?: string;
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { table, record, action = 'create', recordId }: SyncRequest = await req.json();

    if (!table || !record) {
      throw new Error('Missing required fields: table and record');
    }

    const airtableTableId = tableMapping[table];
    if (!airtableTableId) {
      throw new Error(`Unknown table: ${table}`);
    }

    if (!AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY environment variable is not set');
    }

    const airtableRecord = { fields: record };
    let response: Response;
    let url: string;

    if (action === 'update' && recordId) {
      url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}/${recordId}`;
      response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableRecord),
      });
    } else if (action === 'delete' && recordId) {
      url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}/${recordId}`;
      response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      });
    } else {
      url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}`;
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableRecord),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('webhook_events').insert({
          event_type: `airtable_sync_${action}`,
          source: 'sync-to-airtable',
          table_name: table,
          payload: { table, record, action, airtable_response: data },
          status: 'success',
        });
      } catch (logError) {
        console.error('Failed to log webhook event:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        data,
        message: `Successfully ${action}d record to Airtable table ${table}`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('webhook_events').insert({
          event_type: 'airtable_sync_error',
          source: 'sync-to-airtable',
          payload: { error: error.message },
          status: 'error',
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      }
    );
  }
});
