// ─────────────────────────────────────────────────────────────────────────────
// Automation: RFQ Updated
// Trigger:    When record is updated in "RFQs" table
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  /  SUPABASE_WEBHOOK_URL  /  SUPABASE_ANON_KEY
//
// Input variables:
//   recordId        →  Record ID
//   product         →  Product
//   quantity        →  Quantity (MT)
//   deadline        →  Deadline
//   status          →  Status
//   rfqStatus       →  RFQ Status
//   targetPrice     →  Target Price USD per MT
//   maxBudget       →  Max Budget USD
//   buyerContact    →  Buyer Contact
//   destinationCountry → Destination Country
//   notes           →  Notes
// ─────────────────────────────────────────────────────────────────────────────

function safe(val, fallback = '') {
  return (val !== null && val !== undefined && val !== '') ? val : fallback;
}

const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl    = input.secret('SUPABASE_WEBHOOK_URL');
const anonKey       = input.secret('SUPABASE_ANON_KEY');

if (!webhookSecret) throw new Error('Missing secret: AIRTABLE_WEBHOOK_SECRET');
if (!webhookUrl)    throw new Error('Missing secret: SUPABASE_WEBHOOK_URL');
if (!anonKey)       throw new Error('Missing secret: SUPABASE_ANON_KEY');

const config = input.config();
const recordId          = safe(config.recordId);
const product           = safe(config.product, 'Unknown Product');
const status            = safe(config.status, 'Open');
const rfqStatus         = safe(config.rfqStatus);
const buyerContact      = safe(config.buyerContact);
const deadline          = safe(config.deadline);
const destinationCountry= safe(config.destinationCountry);
const notes             = safe(config.notes);
const quantity          = config.quantity    ?? null;
const targetPrice       = config.targetPrice ?? null;
const maxBudget         = config.maxBudget   ?? null;

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const eventName = `RFQ Updated - ${product}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'RFQs',
  action:    'update',
  recordId,
  record: {
    'Product':                    product,
    'Quantity (MT)':              quantity,
    'Deadline':                   deadline || null,
    'Status':                     status,
    'RFQ Status':                 rfqStatus,
    'Target Price USD per MT':    targetPrice,
    'Max Budget USD':             maxBudget,
    'Buyer Contact':              buyerContact,
    'Destination Country':        destinationCountry,
    'Notes':                      notes,
  },
  eventName,
  timestamp: new Date().toISOString(),
};

const res = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey,
  },
  body: JSON.stringify(payload),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Webhook failed ${res.status}: ${body}`);
  throw new Error(`${eventName} → webhook failed: ${res.status}`);
}
console.log(`${eventName} → synced. Response: ${body}`);
