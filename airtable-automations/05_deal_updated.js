// Automation: Deal Updated
// Trigger: Record updated in "Deals" table
// Input variables:
//   recordId      → {Record ID}
//   dealName      → {Deal Name}
//   dealStatus    → {Status}
//   buyerOrg      → {Buyer Organization}
//   sellerOrg     → {Seller Organization}
//   commodity     → {Commodity}
//   dealValue     → {Deal Value (USD)}
//   closeDate     → {Close Date}
//   stageNotes    → {Stage Notes}
//   assignedTo    → {Assigned To}
// Required secrets: AIRTABLE_WEBHOOK_SECRET, SUPABASE_WEBHOOK_URL

function safe(val, fallback) {
  return (val !== null && val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

const config = input.config();
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl = input.secret('SUPABASE_WEBHOOK_URL');

if (!webhookSecret) throw new Error('Missing AIRTABLE_WEBHOOK_SECRET secret');
if (!webhookUrl)    throw new Error('Missing SUPABASE_WEBHOOK_URL secret');

const recordId   = safe(config.recordId,   '');
const dealName   = safe(config.dealName,   'Unnamed Deal');
const dealStatus = safe(config.dealStatus, 'Open');
const buyerOrg   = safe(config.buyerOrg,  '');
const sellerOrg  = safe(config.sellerOrg, '');
const commodity  = safe(config.commodity, '');
const closeDate  = safe(config.closeDate, '');
const stageNotes = safe(config.stageNotes,'');
const assignedTo = safe(config.assignedTo,'');
const dealValue  = config.dealValue ?? null;

if (!recordId) {
  throw new Error('Missing recordId in input config');
}

const eventName = `Deal Updated - ${dealName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'Deals',
  action: 'update',
  recordId,
  record: {
    'Deal Name':             dealName,
    'Status':                dealStatus,
    'Buyer Organization':    buyerOrg,
    'Seller Organization':   sellerOrg,
    'Commodity':             commodity,
    'Deal Value (USD)':      dealValue,
    'Close Date':            closeDate || null,
    'Stage Notes':           stageNotes,
    'Assigned To':           assignedTo,
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
  throw new Error(`Deal webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully.`);
