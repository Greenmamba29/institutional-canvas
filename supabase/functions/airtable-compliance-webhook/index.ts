import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AIRTABLE_WEBHOOK_SECRET = Deno.env.get('AIRTABLE_COMPLIANCE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-airtable-signature',
};

// Map Airtable table names to Supabase tables
const tableMapping: Record<string, string> = {
  'Collection_Sites': 'collection_sites',
  'Collection_Workers': 'collection_workers',
  'Battery_Inventory': 'battery_inventory',
  'Chain_Of_Custody': 'chain_of_custody',
  'Processing_Orders': 'processing_orders',
  'Audit_Logs': 'compliance_audit_logs',
};

// Field transformers: Airtable field names -> Supabase column names
const fieldTransformers: Record<string, Record<string, string>> = {
  'collection_sites': {
    'Name': 'name', 'Address': 'address', 'Partner_Type': 'partner_type',
    'Capacity_Kg': 'capacity_kg', 'Status': 'status', 'Supabase_ID': 'id',
  },
  'collection_workers': {
    'Name': 'name', 'Partner_ID': 'partner_id', 'KYC_Status': 'kyc_status',
    'Training_Status': 'training_status', 'Certifications': 'certifications',
    'Pay_Rate': 'pay_rate_usd', 'Active_Contracts': 'active_contracts', 'Supabase_ID': 'id',
  },
  'battery_inventory': {
    'Battery_Type': 'battery_type', 'Chemistry': 'chemistry', 'Weight_Kg': 'weight_kg',
    'SOC': 'state_of_charge', 'Status': 'status', 'Timestamp': 'collected_at', 'Supabase_ID': 'id',
  },
  'chain_of_custody': {
    'Inventory_ID': 'inventory_id', 'Previous_Owner': 'previous_owner', 'New_Owner': 'new_owner',
    'Transfer_Time': 'transfer_time', 'Transport_Mode': 'transport_mode',
    'Condition': 'condition', 'Evidence_Link': 'evidence_url',
    'Signature_Hash': 'signature_hash', 'Supabase_ID': 'id',
  },
  'processing_orders': {
    'Inventory_ID': 'inventory_id', 'Processor_ID': 'processor_id',
    'Processing_Method': 'processing_method', 'Processed_Output': 'processed_output',
    'Output_Weight_Kg': 'output_weight_kg', 'Output_Value_USD': 'output_value_usd',
    'Processing_Date': 'processing_date', 'Supabase_ID': 'id',
  },
  'compliance_audit_logs': {
    'Entity_ID': 'entity_id', 'Entity_Type': 'entity_type', 'Action': 'action',
    'Performed_By': 'performed_by', 'Timestamp': 'created_at',
    'Notes': 'notes', 'Compliance_Result': 'compliance_result',
    'Regulation_Refs': 'regulation_refs', 'Supabase_ID': 'id',
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

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!AIRTABLE_WEBHOOK_SECRET || !signature) {
    console.warn('Webhook signature verification skipped: missing secret or signature');
    return true; // Allow if not configured (development mode)
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AIRTABLE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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
    const signature = req.headers.get('x-airtable-signature');

    // Verify webhook signature
    const isValid = await verifySignature(bodyText, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const payload: AirtableWebhookPayload = JSON.parse(bodyText);
    console.log('Received Airtable compliance webhook:', JSON.stringify(payload, null, 2));

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
      event_type: 'airtable_compliance_webhook',
      source: 'airtable-compliance-webhook',
      payload: { ...payload, results },
      status: results.every(r => r.success) ? 'success' : 'partial',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Airtable compliance webhook processed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Airtable compliance webhook error:', error);
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
