import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_TOKEN = Deno.env.get('AIRTABLE_GRANT_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

// Map Airtable table names to Supabase tables
const tableMapping: Record<string, string> = {
  'Grants': 'grants',
  'Grant_Applications': 'grant_applications',
  'Readiness_Scores': 'readiness_scores',
  'Flash_Alerts': 'flash_alerts',
  'Partner_Matching': 'partner_matching',
  'Funding_Pipeline': 'funding_pipeline',
};

// Field transformers: Airtable field names -> Supabase column names
const fieldTransformers: Record<string, Record<string, string>> = {
  'grants': {
    'Title': 'title', 'Funding_Source': 'funding_source', 'Category': 'category',
    'Amount_Min': 'amount_min', 'Amount_Max': 'amount_max', 'Deadline': 'deadline',
    'Status': 'status', 'Eligibility_Criteria': 'eligibility_criteria',
    'External_URL': 'external_url', 'Notes': 'notes', 'Supabase_ID': 'id',
  },
  'grant_applications': {
    'Grant_ID': 'grant_id', 'Org_ID': 'org_id', 'Status': 'status',
    'Submitted_At': 'submitted_at', 'Awarded_At': 'awarded_at',
    'Award_Amount': 'award_amount', 'Notes': 'notes', 'Supabase_ID': 'id',
  },
  'readiness_scores': {
    'Org_ID': 'org_id', 'Score': 'score', 'Details': 'details',
    'Criteria_Met': 'criteria_met', 'Last_Updated': 'updated_at', 'Supabase_ID': 'id',
  },
  'flash_alerts': {
    'Org_ID': 'org_id', 'Title': 'title', 'Message': 'message',
    'Type': 'type', 'Source': 'source',
  },
  'partner_matching': {
    'Org_ID': 'org_id', 'Partner_Org_ID': 'partner_org_id', 'Grant_ID': 'grant_id',
    'Role': 'role', 'Status': 'status', 'Match_Score': 'match_score',
    'Notes': 'notes', 'Supabase_ID': 'id',
  },
  'funding_pipeline': {
    'Grant_ID': 'grant_id', 'Org_ID': 'org_id', 'RFQ_ID': 'rfq_id', 'PO_ID': 'po_id',
    'Stage': 'stage', 'Grant_Amount': 'grant_amount', 'Deployed_Amount': 'deployed_amount',
    'Notes': 'notes', 'Supabase_ID': 'id',
  },
};

function transformAirtableFields(tableName: string, fields: Record<string, any>): Record<string, any> {
  const transformer = fieldTransformers[tableName];
  if (!transformer) return fields;

  const transformed: Record<string, any> = {};
  for (const [airtableField, value] of Object.entries(fields)) {
    const supabaseColumn = transformer[airtableField];
    if (supabaseColumn) {
      // Parse JSON strings back to objects
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          transformed[supabaseColumn] = JSON.parse(value);
        } catch {
          transformed[supabaseColumn] = value;
        }
      } else {
        transformed[supabaseColumn] = value;
      }
    }
  }
  return transformed;
}

function verifyToken(token: string | null): boolean {
  // Airtable "Send webhook" action sends a static header value — simple equality check.
  // Set x-webhook-token header in your Airtable automation to match AIRTABLE_GRANT_WEBHOOK_SECRET.
  if (!WEBHOOK_TOKEN) return true;
  return token === WEBHOOK_TOKEN;
}

interface AirtableWebhookPayload {
  base?: { id: string };
  webhook?: { id: string };
  timestamp?: string;
  payloads?: Array<{
    changedTablesById?: Record<string, {
      changedRecordsById?: Record<string, {
        current?: { cellValuesByFieldId: Record<string, any> };
        previous?: { cellValuesByFieldId: Record<string, any> };
      }>;
      createdRecordsById?: Record<string, {
        cellValuesByFieldId: Record<string, any>;
      }>;
      destroyedRecordIds?: string[];
    }>;
  }>;
  // Simple automation payload format
  table?: string;
  record?: Record<string, any>;
  action?: 'create' | 'update' | 'delete';
  recordId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const token = req.headers.get('x-webhook-token');
    if (!verifyToken(token)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const payload: AirtableWebhookPayload = JSON.parse(bodyText);
    console.log('Received Airtable grant webhook:', JSON.stringify(payload, null, 2));

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: Array<{ table: string; action: string; success: boolean; error?: string }> = [];

    // Handle simple automation format (from Airtable Automations)
    if (payload.table && payload.record) {
      const supabaseTable = tableMapping[payload.table] || payload.table;
      const transformedRecord = transformAirtableFields(supabaseTable, payload.record);

      let error;
      if (payload.action === 'create') {
        const result = await supabase.from(supabaseTable).insert(transformedRecord);
        error = result.error;
      } else if (payload.action === 'update' && payload.recordId) {
        const result = await supabase
          .from(supabaseTable)
          .upsert({ ...transformedRecord, airtable_id: payload.recordId }, { onConflict: 'airtable_id' });
        error = result.error;
      } else if (payload.action === 'delete' && payload.recordId) {
        const result = await supabase.from(supabaseTable).delete().eq('airtable_id', payload.recordId);
        error = result.error;
      }

      results.push({
        table: supabaseTable,
        action: payload.action || 'unknown',
        success: !error,
        error: error?.message,
      });

      // Log to airtable_sync_log
      if (!error) {
        await supabase.from('airtable_sync_log').insert({
          table_name: supabaseTable,
          airtable_id: payload.recordId,
          action: payload.action,
          synced_at: new Date().toISOString(),
        }).then(() => {}).catch((logErr: Error) => {
          console.warn('airtable_sync_log insert failed (table may not exist):', logErr.message);
        });
      }

      console.log(`Processed ${payload.action} for ${supabaseTable}:`, results[0]);
    }

    // Log the webhook event
    await supabase.from('webhook_events').insert({
      event_type: 'airtable_grant_webhook',
      source: 'airtable-grant-webhook',
      payload: { ...payload, results },
      status: results.every(r => r.success) ? 'success' : 'partial',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Airtable grant webhook processed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Airtable grant webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
