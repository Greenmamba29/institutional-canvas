import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Action = 'create' | 'read' | 'update' | 'delete' | 'list';
type SubscriptionTier = 'pro' | 'enterprise' | 'admin';

interface CrudRequest {
  action: Action;
  table: string;
  record_id?: string;
  fields?: Record<string, unknown>;
  filter?: string;
  maxRecords?: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  subscription_tier?: SubscriptionTier;
  // Batch operations (enterprise only)
  records?: Array<{ fields: Record<string, unknown> }>;
}

// ---------------------------------------------------------------------------
// Allowed tables
// ---------------------------------------------------------------------------

const ALLOWED_TABLES = new Set([
  'FAQs',
  'Products',
  'Market_Intelligence',
  'Auction_Companies',
  'Auction_Contacts',
  'Prompt_Executions',
  'Decision_Log',
  'Blockers',
  'Analytics_Events',
  'GMV_Metrics',
  // Grant intelligence
  'Grants',
  'Grant_Applications',
  'Readiness_Scores',
  'Evidence_Documents',
  'Partner_Matching',
  'Funding_Pipeline',
  'Flash_Alerts',
]);

// Airtable table name -> Supabase table name (only for tables that should sync)
const SUPABASE_SYNC_TABLES: Record<string, string> = {
  'Auction_Companies': 'auction_companies',
  'Auction_Contacts': 'auction_contacts',
};

// ---------------------------------------------------------------------------
// Subscription gating
// ---------------------------------------------------------------------------

const TIER_PERMISSIONS: Record<SubscriptionTier, Set<Action>> = {
  pro: new Set(['create', 'read', 'update', 'delete', 'list']),
  enterprise: new Set(['create', 'read', 'update', 'delete', 'list']),
  admin: new Set(['create', 'read', 'update', 'delete', 'list']),
};

function assertTierPermission(tier: SubscriptionTier, action: Action): void {
  if (!TIER_PERMISSIONS[tier]?.has(action)) {
    throw new PermissionError(
      `Action "${action}" is not allowed on the "${tier}" subscription tier. Upgrade to pro or enterprise for full CRUD access.`
    );
  }
}

function assertBatchPermission(tier: SubscriptionTier): void {
  if (tier !== 'enterprise') {
    throw new PermissionError(
      'Batch operations require an enterprise subscription tier.'
    );
  }
}

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildAirtableUrl(table: string, recordId?: string): string {
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`;
  return recordId ? `${base}/${recordId}` : base;
}

function airtableHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Supabase sync – write-through for supported tables
// ---------------------------------------------------------------------------

async function syncToSupabase(
  table: string,
  action: 'create' | 'update',
  airtableRecord: Record<string, unknown>,
): Promise<void> {
  const supabaseTable = SUPABASE_SYNC_TABLES[table];
  if (!supabaseTable) return; // Not a sync-eligible table
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[airtable-crud] Supabase not configured, skipping sync');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build the row from the Airtable response – the response has { id, fields, ... }
    const fields = (airtableRecord.fields ?? {}) as Record<string, unknown>;
    const row: Record<string, unknown> = {
      airtable_id: airtableRecord.id,
      ...fields,
      synced_at: new Date().toISOString(),
    };

    if (action === 'create') {
      const { error } = await supabase.from(supabaseTable).upsert(row, {
        onConflict: 'airtable_id',
      });
      if (error) throw error;
      console.log(`[airtable-crud] Synced new record to ${supabaseTable}`);
    } else if (action === 'update') {
      const { error } = await supabase
        .from(supabaseTable)
        .update(row)
        .eq('airtable_id', airtableRecord.id);
      if (error) throw error;
      console.log(`[airtable-crud] Synced updated record to ${supabaseTable}`);
    }
  } catch (syncError) {
    // Sync failures should not break the main operation – log and continue
    console.error(`[airtable-crud] Supabase sync error for ${supabaseTable}:`, syncError);
  }
}

// ---------------------------------------------------------------------------
// CRUD operation handlers
// ---------------------------------------------------------------------------

async function handleCreate(
  table: string,
  fields: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = buildAirtableUrl(table);
  console.log(`[airtable-crud] Creating record in table: ${table}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[airtable-crud] Airtable create error: ${response.status} - ${errorText}`);
    throw new Error(`Airtable API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`[airtable-crud] Created record ${data.id} in ${table}`);

  // Sync to Supabase
  await syncToSupabase(table, 'create', data);

  return data;
}

async function handleRead(
  table: string,
  recordId: string,
): Promise<Record<string, unknown>> {
  const url = buildAirtableUrl(table, recordId);
  console.log(`[airtable-crud] Reading record ${recordId} from table: ${table}`);

  const response = await fetch(url, {
    headers: airtableHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[airtable-crud] Airtable read error: ${response.status} - ${errorText}`);
    throw new Error(`Airtable API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`[airtable-crud] Read record ${data.id} from ${table}`);
  return data;
}

async function handleUpdate(
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = buildAirtableUrl(table, recordId);
  console.log(`[airtable-crud] Updating record ${recordId} in table: ${table}`);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[airtable-crud] Airtable update error: ${response.status} - ${errorText}`);
    throw new Error(`Airtable API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`[airtable-crud] Updated record ${data.id} in ${table}`);

  // Sync to Supabase
  await syncToSupabase(table, 'update', data);

  return data;
}

async function handleDelete(
  table: string,
  recordId: string,
): Promise<Record<string, unknown>> {
  const url = buildAirtableUrl(table, recordId);
  console.log(`[airtable-crud] Deleting record ${recordId} from table: ${table}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: airtableHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[airtable-crud] Airtable delete error: ${response.status} - ${errorText}`);
    throw new Error(`Airtable API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`[airtable-crud] Deleted record ${recordId} from ${table}`);
  return data;
}

async function handleList(
  table: string,
  filter?: string,
  maxRecords?: number,
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>,
): Promise<Record<string, unknown>> {
  // Build query parameters (same logic as airtable-proxy)
  const params = new URLSearchParams();
  if (filter) params.append('filterByFormula', filter);
  if (maxRecords) params.append('maxRecords', maxRecords.toString());
  if (sort && Array.isArray(sort)) {
    sort.forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field);
      params.append(`sort[${i}][direction]`, s.direction);
    });
  }

  const url = `${buildAirtableUrl(table)}${params.toString() ? '?' + params.toString() : ''}`;
  console.log(`[airtable-crud] Listing records from table: ${table}`);

  const response = await fetch(url, {
    headers: airtableHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[airtable-crud] Airtable list error: ${response.status} - ${errorText}`);
    throw new Error(`Airtable API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`[airtable-crud] Listed ${data.records?.length || 0} records from ${table}`);
  return data;
}

// ---------------------------------------------------------------------------
// Batch operations (enterprise only)
// ---------------------------------------------------------------------------

async function handleBatchCreate(
  table: string,
  records: Array<{ fields: Record<string, unknown> }>,
): Promise<Record<string, unknown>> {
  const url = buildAirtableUrl(table);
  console.log(`[airtable-crud] Batch creating ${records.length} records in table: ${table}`);

  // Airtable allows max 10 records per request
  const BATCH_SIZE = 10;
  const allCreated: unknown[] = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const response = await fetch(url, {
      method: 'POST',
      headers: airtableHeaders(),
      body: JSON.stringify({ records: batch }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[airtable-crud] Airtable batch create error: ${response.status} - ${errorText}`);
      throw new Error(`Airtable API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    allCreated.push(...(data.records || []));

    // Sync each created record to Supabase
    for (const record of data.records || []) {
      await syncToSupabase(table, 'create', record);
    }
  }

  console.log(`[airtable-crud] Batch created ${allCreated.length} records in ${table}`);
  return { records: allCreated };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
    }

    // Check Airtable configuration
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.log('[airtable-crud] Airtable not configured, returning error');
      return jsonResponse(
        { error: 'Airtable is not configured', configured: false },
        503,
      );
    }

    const body: CrudRequest = await req.json();
    const {
      action,
      table,
      record_id,
      fields,
      filter,
      maxRecords,
      sort,
      subscription_tier = 'pro' as SubscriptionTier,
      records,
    } = body;

    // ----- Validation -----
    if (!action) {
      return jsonResponse({ error: 'action is required' }, 400);
    }
    if (!table) {
      return jsonResponse({ error: 'table is required' }, 400);
    }
    if (!ALLOWED_TABLES.has(table)) {
      return jsonResponse(
        {
          error: `Table "${table}" is not supported. Allowed tables: ${[...ALLOWED_TABLES].join(', ')}`,
        },
        400,
      );
    }

    // ----- Subscription gating -----
    assertTierPermission(subscription_tier, action);

    // ----- Enterprise-only table guard -----
    const ENTERPRISE_ONLY_TABLES = new Set(['Partner_Matching', 'Funding_Pipeline']);
    if (ENTERPRISE_ONLY_TABLES.has(table) && subscription_tier === 'pro') {
      return jsonResponse({ error: `Table "${table}" requires an enterprise subscription.` }, 403);
    }

    // ----- Action-specific validation & dispatch -----
    let result: Record<string, unknown>;

    switch (action) {
      case 'create': {
        if (!fields || Object.keys(fields).length === 0) {
          return jsonResponse({ error: 'fields is required for create action' }, 400);
        }

        // Enterprise batch create
        if (records && records.length > 0) {
          assertBatchPermission(subscription_tier);
          result = await handleBatchCreate(table, records);
          return jsonResponse({
            success: true,
            action: 'batch_create',
            table,
            count: (result.records as unknown[]).length,
            data: result,
          });
        }

        result = await handleCreate(table, fields);
        return jsonResponse({
          success: true,
          action: 'create',
          table,
          data: result,
        });
      }

      case 'read': {
        if (!record_id) {
          return jsonResponse({ error: 'record_id is required for read action' }, 400);
        }
        result = await handleRead(table, record_id);
        return jsonResponse({
          success: true,
          action: 'read',
          table,
          data: result,
        });
      }

      case 'update': {
        if (!record_id) {
          return jsonResponse({ error: 'record_id is required for update action' }, 400);
        }
        if (!fields || Object.keys(fields).length === 0) {
          return jsonResponse({ error: 'fields is required for update action' }, 400);
        }
        result = await handleUpdate(table, record_id, fields);
        return jsonResponse({
          success: true,
          action: 'update',
          table,
          data: result,
        });
      }

      case 'delete': {
        if (!record_id) {
          return jsonResponse({ error: 'record_id is required for delete action' }, 400);
        }
        result = await handleDelete(table, record_id);
        return jsonResponse({
          success: true,
          action: 'delete',
          table,
          data: result,
        });
      }

      case 'list': {
        result = await handleList(table, filter, maxRecords, sort);
        return jsonResponse({
          success: true,
          action: 'list',
          table,
          records: result.records,
          configured: true,
        });
      }

      default:
        return jsonResponse(
          { error: `Unknown action "${action}". Allowed actions: create, read, update, delete, list` },
          400,
        );
    }
  } catch (error) {
    console.error('[airtable-crud] Error:', error);

    if (error instanceof PermissionError) {
      return jsonResponse({ error: error.message }, 403);
    }
    if (error instanceof ValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});
