// ─────────────────────────────────────────────────────────────────────────────
// Automation: Introduction Created / Updated
// Trigger:    When record is created OR updated in "Introductions" table
//             (Create two automations — set `action` input variable to
//              "create" in one and "update" in the other)
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  /  SUPABASE_WEBHOOK_URL  /  SUPABASE_ANON_KEY
//
// Input variables:
//   recordId        →  Record ID
//   action          →  Static text: "create"  OR  "update"
//   introductionId  →  Introduction_ID
//   introducerName  →  Introducer_Name
//   introducerEmail →  Introducer_Email
//   introducerOrg   →  Introducer_Org
//   buyerOrg        →  Buyer_Org
//   buyerContact    →  Buyer_Contact
//   buyerEmail      →  Buyer_Email
//   sellerOrg       →  Seller_Org
//   sellerContact   →  Seller_Contact
//   sellerEmail     →  Seller_Email
//   commodity       →  Commodity
//   introDate       →  Intro_Date
//   dealValue       →  Deal_Value_USD
//   introFeePercent →  Intro_Fee_Percent
//   status          →  Status
//   payoutStatus    →  Payout_Status
//   payoutDate      →  Payout_Date
//   notes           →  Notes
//   supabaseId      →  Supabase_ID
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
const recordId        = safe(config.recordId);
const action          = safe(config.action, 'update');
const introductionId  = safe(config.introductionId);
const introducerName  = safe(config.introducerName);
const introducerEmail = safe(config.introducerEmail);
const introducerOrg   = safe(config.introducerOrg);
const buyerOrg        = safe(config.buyerOrg);
const buyerContact    = safe(config.buyerContact);
const buyerEmail      = safe(config.buyerEmail);
const sellerOrg       = safe(config.sellerOrg);
const sellerContact   = safe(config.sellerContact);
const sellerEmail     = safe(config.sellerEmail);
const commodity       = safe(config.commodity);
const introDate       = safe(config.introDate);
const status          = safe(config.status, 'Pending');
const payoutStatus    = safe(config.payoutStatus, 'Unpaid');
const payoutDate      = safe(config.payoutDate);
const notes           = safe(config.notes);
const supabaseId      = safe(config.supabaseId);
const dealValue       = config.dealValue       ?? null;
const introFeePercent = config.introFeePercent ?? null;

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const partyLabel = (buyerOrg || sellerOrg)
  ? `${buyerOrg || 'Unknown Buyer'} ↔ ${sellerOrg || 'Unknown Seller'}`
  : 'Unknown Parties';
const eventName = `Introduction ${action === 'create' ? 'Created' : 'Updated'} - ${partyLabel}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'Introductions',
  action,
  recordId,
  record: {
    'Introduction_ID':   introductionId,
    'Introducer_Name':   introducerName,
    'Introducer_Email':  introducerEmail,
    'Introducer_Org':    introducerOrg,
    'Buyer_Org':         buyerOrg,
    'Buyer_Contact':     buyerContact,
    'Buyer_Email':       buyerEmail,
    'Seller_Org':        sellerOrg,
    'Seller_Contact':    sellerContact,
    'Seller_Email':      sellerEmail,
    'Commodity':         commodity,
    'Intro_Date':        introDate        || null,
    'Deal_Value_USD':    dealValue,
    'Intro_Fee_Percent': introFeePercent,
    'Status':            status,
    'Payout_Status':     payoutStatus,
    'Payout_Date':       payoutDate       || null,
    'Notes':             notes,
    'Supabase_ID':       supabaseId,
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
