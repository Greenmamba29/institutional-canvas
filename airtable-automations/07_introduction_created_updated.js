// Automation: Introduction Created / Updated
// Trigger: Record created OR updated in "Introductions" table
// Input variables:
//   recordId       → {Record ID}
//   action         → "create" or "update" (set as static text in each automation)
//   introductionId → {Introduction ID}
//   introducerName → {Introducer Name}
//   introducerEmail→ {Introducer Email}
//   introducerOrg  → {Introducer Org}
//   buyerOrg       → {Buyer Org}
//   buyerContact   → {Buyer Contact}
//   buyerEmail     → {Buyer Email}
//   sellerOrg      → {Seller Org}
//   sellerContact  → {Seller Contact}
//   sellerEmail    → {Seller Email}
//   commodity      → {Commodity}
//   introDate      → {Intro Date}
//   dealValue      → {Deal Value (USD)}
//   status         → {Status}
//   notes          → {Notes}
// Required secrets: AIRTABLE_WEBHOOK_SECRET, SUPABASE_WEBHOOK_URL

function safe(val, fallback) {
  return (val !== null && val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

const config = input.config();
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl = input.secret('SUPABASE_WEBHOOK_URL');

if (!webhookSecret) throw new Error('Missing AIRTABLE_WEBHOOK_SECRET secret');
if (!webhookUrl)    throw new Error('Missing SUPABASE_WEBHOOK_URL secret');

const recordId        = safe(config.recordId,        '');
const action          = safe(config.action,          'update');
const introductionId  = safe(config.introductionId,  '');
const introducerName  = safe(config.introducerName,  '');
const introducerEmail = safe(config.introducerEmail, '');
const introducerOrg   = safe(config.introducerOrg,   '');
const buyerOrg        = safe(config.buyerOrg,        '');
const buyerContact    = safe(config.buyerContact,    '');
const buyerEmail      = safe(config.buyerEmail,      '');
const sellerOrg       = safe(config.sellerOrg,       '');
const sellerContact   = safe(config.sellerContact,   '');
const sellerEmail     = safe(config.sellerEmail,     '');
const commodity       = safe(config.commodity,       '');
const introDate       = safe(config.introDate,       '');
const status          = safe(config.status,          'Pending');
const notes           = safe(config.notes,           '');
const dealValue       = config.dealValue ?? null;

if (!recordId) {
  throw new Error('Missing recordId in input config');
}

// Build a meaningful event name from available party names
const partyLabel = (buyerOrg || sellerOrg)
  ? `${buyerOrg || 'Unknown Buyer'} ↔ ${sellerOrg || 'Unknown Seller'}`
  : 'Unknown Parties';
const eventName = `Introduction ${action === 'create' ? 'Created' : 'Updated'} - ${partyLabel}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'Introductions',
  action,
  recordId,
  record: {
    'Introduction_ID':    introductionId,
    'Introducer_Name':    introducerName,
    'Introducer_Email':   introducerEmail,
    'Introducer_Org':     introducerOrg,
    'Buyer_Org':          buyerOrg,
    'Buyer_Contact':      buyerContact,
    'Buyer_Email':        buyerEmail,
    'Seller_Org':         sellerOrg,
    'Seller_Contact':     sellerContact,
    'Seller_Email':       sellerEmail,
    'Commodity':          commodity,
    'Intro_Date':         introDate || null,
    'Deal_Value_USD':     dealValue,
    'Status':             status,
    'Notes':              notes,
    'Supabase_ID':        safe(config.supabaseId, ''),
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
  throw new Error(`Introduction webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully.`);
