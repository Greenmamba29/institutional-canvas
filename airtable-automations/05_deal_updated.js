// ─────────────────────────────────────────────────────────────────────────────
// Automation: Deal Updated
// Trigger:    When record is updated in "Deals" table
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  /  SUPABASE_WEBHOOK_URL  /  SUPABASE_ANON_KEY
//
// Input variables:
//   recordId        →  Record ID
//   product         →  Product
//   status          →  Status
//   dealStage       →  Deal Stage
//   dealDate        →  Deal Date
//   quantity        →  Quantity (MT)
//   pricePerMt      →  Price (USD/MT)
//   totalValue      →  Total Value
//   currency        →  Currency
//   incoterm        →  Incoterm
//   paymentMethod   →  Payment Method
//   escrowStatus    →  Escrow Status
//   dealOwner       →  Deal Owner
//   priority        →  Priority
//   riskLevel       →  Risk Level
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
const recordId      = safe(config.recordId);
const product       = safe(config.product, 'Unnamed Deal');
const status        = safe(config.status, 'Open');
const dealStage     = safe(config.dealStage);
const dealDate      = safe(config.dealDate);
const currency      = safe(config.currency, 'USD');
const incoterm      = safe(config.incoterm);
const paymentMethod = safe(config.paymentMethod);
const escrowStatus  = safe(config.escrowStatus);
const dealOwner     = safe(config.dealOwner);
const priority      = safe(config.priority);
const riskLevel     = safe(config.riskLevel);
const notes         = safe(config.notes);
const quantity      = config.quantity    ?? null;
const pricePerMt    = config.pricePerMt  ?? null;
const totalValue    = config.totalValue  ?? null;

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const eventName = `Deal Updated - ${product}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'Deals',
  action:    'update',
  recordId,
  record: {
    'Product':          product,
    'Status':           status,
    'Deal Stage':       dealStage,
    'Deal Date':        dealDate  || null,
    'Quantity (MT)':    quantity,
    'Price (USD/MT)':   pricePerMt,
    'Total Value':      totalValue,
    'Currency':         currency,
    'Incoterm':         incoterm,
    'Payment Method':   paymentMethod,
    'Escrow Status':    escrowStatus,
    'Deal Owner':       dealOwner,
    'Priority':         priority,
    'Risk Level':       riskLevel,
    'Notes':            notes,
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
