// Automation: Market Intelligence Sync
// Trigger: Scheduled (e.g. daily) OR manually run
// Required input.config() fields: (none — reads from base directly)
// Required input.secret() fields: AIRTABLE_WEBHOOK_SECRET, SUPABASE_WEBHOOK_URL
//
// Setup: In Airtable Automations > "Run a script" step:
//   - Add secret: AIRTABLE_WEBHOOK_SECRET
//   - Add secret: SUPABASE_WEBHOOK_URL  (your Supabase edge function URL)

function safe(val, fallback) {
  return (val !== null && val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

const config = input.config();
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl = input.secret('SUPABASE_WEBHOOK_URL');

if (!webhookSecret) {
  console.error('AIRTABLE_WEBHOOK_SECRET is not set. Add it as a secret in the automation editor.');
  throw new Error('Missing AIRTABLE_WEBHOOK_SECRET secret');
}
if (!webhookUrl) {
  console.error('SUPABASE_WEBHOOK_URL is not set. Add it as a secret in the automation editor.');
  throw new Error('Missing SUPABASE_WEBHOOK_URL secret');
}

// Read market price records from this base
const base = base || undefined; // Airtable provides `base` in script context
const marketPricesTable = base.getTable('Market Prices');
const query = await marketPricesTable.selectRecordsAsync({
  fields: ['Product Type', 'Purity', 'Region', 'Price (USD)', 'Price Change 24h', 'Market Trend', 'Source', 'Confidence Score', 'Last Updated'],
});

const records = query.records.map(r => ({
  product_type:    safe(r.getCellValueAsString('Product Type'), 'Unknown'),
  purity:          safe(r.getCellValueAsString('Purity'), ''),
  region:          safe(r.getCellValueAsString('Region'), ''),
  price_usd:       r.getCellValue('Price (USD)') ?? null,
  price_change_24h:r.getCellValue('Price Change 24h') ?? null,
  market_trend:    safe(r.getCellValueAsString('Market Trend'), 'Stable'),
  source:          safe(r.getCellValueAsString('Source'), 'Airtable'),
  confidence_score:r.getCellValue('Confidence Score') ?? null,
  airtable_id:     r.id,
}));

const payload = {
  _secret: webhookSecret,
  table: 'Market Prices',
  action: 'sync_batch',
  records,
  timestamp: new Date().toISOString(),
};

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Sync failed: ${response.status}`, body);
  throw new Error(`Market Intelligence Sync failed: ${response.status}`);
}

console.log(`Market Intelligence Sync complete. ${records.length} records sent. Response: ${body}`);
