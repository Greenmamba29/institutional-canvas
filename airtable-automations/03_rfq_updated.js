// Automation: RFQ Updated
// Trigger: Record updated in "RFQs" table
// Input variables:
//   recordId       → {Record ID}
//   product        → {Product} field value
//   quantity       → {Quantity (MT)} field value
//   deadline       → {Deadline} field value
//   rfqStatus      → {Status} field value
//   buyerOrg       → {Buyer Organization} field value
//   buyerContact   → {Buyer Contact} field value
//   buyerEmail     → {Buyer Email} field value
//   targetPrice    → {Target Price (USD/MT)} field value
//   notes          → {Notes} field value
// Required secrets: AIRTABLE_WEBHOOK_SECRET, SUPABASE_WEBHOOK_URL

function safe(val, fallback) {
  return (val !== null && val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

const config = input.config();
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl = input.secret('SUPABASE_WEBHOOK_URL');

if (!webhookSecret) throw new Error('Missing AIRTABLE_WEBHOOK_SECRET secret');
if (!webhookUrl)    throw new Error('Missing SUPABASE_WEBHOOK_URL secret');

const recordId     = safe(config.recordId,    '');
const product      = safe(config.product,     'Unknown Product');
const rfqStatus    = safe(config.rfqStatus,   'Open');
const buyerOrg     = safe(config.buyerOrg,    '');
const buyerContact = safe(config.buyerContact,'');
const buyerEmail   = safe(config.buyerEmail,  '');
const deadline     = safe(config.deadline,    '');
const notes        = safe(config.notes,       '');
const quantity     = config.quantity    ?? null;
const targetPrice  = config.targetPrice ?? null;

if (!recordId) {
  throw new Error('Missing recordId in input config');
}

const eventName = `RFQ Updated - ${product}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'RFQs',
  action: 'update',
  recordId,
  record: {
    'Product':               product,
    'Quantity (MT)':         quantity,
    'Deadline':              deadline || null,
    'Status':                rfqStatus,
    'Buyer Organization':    buyerOrg,
    'Buyer Contact':         buyerContact,
    'Buyer Email':           buyerEmail,
    'Target Price (USD/MT)': targetPrice,
    'Notes':                 notes,
  },
  eventName,
  timestamp: new Date().toISOString(),
};

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Webhook failed: ${response.status}`, body);
  throw new Error(`RFQ webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully.`);
