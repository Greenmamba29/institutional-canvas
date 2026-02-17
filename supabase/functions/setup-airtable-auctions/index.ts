import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID') || 'appu9fRT4qFBCf8wL';
const AIRTABLE_AUCTIONS_TABLE = Deno.env.get('AIRTABLE_AUCTIONS_TABLE') || 'tbl4oywNOsuRrvabQ';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Auction field definitions for Airtable Metadata API
const AUCTION_FIELDS = [
  { name: 'Auction_ID', type: 'singleLineText', description: 'Supabase auction UUID' },
  { name: 'Title', type: 'singleLineText', description: 'Auction title' },
  { name: 'Description', type: 'multilineText', description: 'Auction description' },
  { name: 'Product_Type', type: 'singleSelect', description: 'Lithium product type', options: {
    choices: [
      { name: 'lithium_carbonate', color: 'blueLight2' },
      { name: 'lithium_hydroxide', color: 'greenLight2' },
      { name: 'black_mass', color: 'purpleLight2' },
      { name: 'spodumene', color: 'orangeLight2' },
      { name: 'recycled_material', color: 'tealLight2' },
    ]
  }},
  { name: 'Status', type: 'singleSelect', description: 'Auction lifecycle status', options: {
    choices: [
      { name: 'scheduled', color: 'yellowDark' },
      { name: 'live', color: 'greenDark' },
      { name: 'ended', color: 'redDark' },
    ]
  }},
  { name: 'Start_Time', type: 'dateTime', description: 'Auction start time', options: { timeZone: 'utc', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
  { name: 'End_Time', type: 'dateTime', description: 'Auction end time', options: { timeZone: 'utc', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
  { name: 'Reserve_Price', type: 'currency', description: 'Minimum acceptable price', options: { precision: 2, symbol: '$' } },
  { name: 'Starting_Bid', type: 'currency', description: 'Opening bid amount', options: { precision: 2, symbol: '$' } },
  { name: 'Current_Bid', type: 'currency', description: 'Highest current bid', options: { precision: 2, symbol: '$' } },
  { name: 'Bid_Increment', type: 'currency', description: 'Minimum bid increment', options: { precision: 2, symbol: '$' } },
  { name: 'Currency', type: 'singleLineText', description: 'Currency code (USD)' },
  { name: 'Quantity', type: 'number', description: 'Lot quantity', options: { precision: 2 } },
  { name: 'Unit', type: 'singleLineText', description: 'Unit of measurement' },
  { name: 'Winner_ID', type: 'singleLineText', description: 'Winning bidder ID' },
  { name: 'Extended_Count', type: 'number', description: 'Anti-sniping extension count', options: { precision: 0 } },
  { name: 'Org_ID', type: 'singleLineText', description: 'Seller organization ID' },
  { name: 'Created_At', type: 'dateTime', description: 'Record creation time', options: { timeZone: 'utc', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
  { name: 'Updated_At', type: 'dateTime', description: 'Last update time', options: { timeZone: 'utc', dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' } } },
];

async function createFieldsInAirtable(tableId: string): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // First, get existing fields
  const listUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
  const listRes = await fetch(listUrl, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
  });

  let existingFieldNames: string[] = [];
  if (listRes.ok) {
    const meta = await listRes.json();
    const table = meta.tables?.find((t: any) => t.id === tableId);
    if (table) {
      existingFieldNames = table.fields.map((f: any) => f.name);
    }
  }

  // Create each missing field
  for (const field of AUCTION_FIELDS) {
    if (existingFieldNames.includes(field.name)) {
      skipped.push(field.name);
      continue;
    }

    const createUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables/${tableId}/fields`;
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(field),
    });

    if (res.ok) {
      created.push(field.name);
    } else {
      const errText = await res.text();
      errors.push(`${field.name}: ${res.status} - ${errText}`);
    }
  }

  return { created, skipped, errors };
}

async function syncAuctionsToAirtable(supabase: any, tableId: string): Promise<{ synced: number; failed: number; errors: string[] }> {
  const { data: auctions, error } = await supabase
    .from('auctions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { synced: 0, failed: 0, errors: [error.message] };
  if (!auctions?.length) return { synced: 0, failed: 0, errors: [] };

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < auctions.length; i += 10) {
    const batch = auctions.slice(i, i + 10);
    const records = batch.map((a: any) => ({
      fields: {
        Auction_ID: a.id,
        Title: a.title,
        Description: a.description || '',
        Product_Type: a.product_type || undefined,
        Status: a.status || undefined,
        Start_Time: a.start_time ?? a.starts_at,
        End_Time: a.end_time ?? a.ends_at,
        Reserve_Price: a.reserve_price,
        Starting_Bid: a.starting_bid,
        Current_Bid: a.current_bid,
        Bid_Increment: a.bid_increment,
        Currency: a.currency || 'USD',
        Quantity: a.quantity,
        Unit: a.unit || '',
        Winner_ID: a.winner_id || '',
        Extended_Count: a.extended_count ?? 0,
        Org_ID: a.org_id,
        Created_At: a.created_at,
        Updated_At: a.updated_at,
      },
    }));

    // Clean undefined values
    for (const rec of records) {
      for (const [k, v] of Object.entries(rec.fields)) {
        if (v === undefined || v === null) delete (rec.fields as any)[k];
      }
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records, typecast: true }),
    });

    if (res.ok) {
      synced += batch.length;
    } else {
      const errText = await res.text();
      failed += batch.length;
      errors.push(`Batch ${i / 10 + 1}: ${res.status} - ${errText}`);
    }
  }

  return { synced, failed, errors };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!AIRTABLE_API_KEY) throw new Error('AIRTABLE_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Create fields in Airtable table
    console.log('Step 1: Creating Airtable fields...');
    const fieldResults = await createFieldsInAirtable(AIRTABLE_AUCTIONS_TABLE);
    console.log('Field creation results:', JSON.stringify(fieldResults));

    // Step 2: Sync auction records
    console.log('Step 2: Syncing auction records...');
    const syncResults = await syncAuctionsToAirtable(supabase, AIRTABLE_AUCTIONS_TABLE);
    console.log('Sync results:', JSON.stringify(syncResults));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Airtable auction setup and sync complete',
        fields: fieldResults,
        sync: syncResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Setup error:', errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
