// ─────────────────────────────────────────────────────────────────────────────
// Automation: Supplier Updated
// Trigger:    When record is updated in "Suppliers" table
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  →  your custom shared secret
//   SUPABASE_WEBHOOK_URL     →  https://vuekwckknfjivjighhfd.supabase.co/functions/v1/airtable-market-webhook
//   SUPABASE_ANON_KEY        →  (Supabase anon key)
//
// Input variables (map each to the corresponding field in the trigger record):
//   recordId       →  Record ID  (insert as: "Airtable record ID")
//   supplierName   →  Supplier Name
//   contactPerson  →  Contact Person
//   contactEmail   →  Contact Email
//   phone          →  Phone Number
//   country        →  Country
//   status         →  Status
//   supplierTier   →  Supplier Tier
//   annualCapacity →  Annual Production Capacity MT
//   notes          →  Notes
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
const recordId       = safe(config.recordId);
const supplierName   = safe(config.supplierName, 'Unknown Supplier');
const contactPerson  = safe(config.contactPerson);
const contactEmail   = safe(config.contactEmail);
const phone          = safe(config.phone);
const country        = safe(config.country);
const status         = safe(config.status, 'Pending');
const supplierTier   = safe(config.supplierTier);
const annualCapacity = config.annualCapacity ?? null;
const notes          = safe(config.notes);

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const eventName = `Supplier Updated - ${supplierName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'Suppliers',
  action:    'update',
  recordId,
  record: {
    'Supplier Name':                 supplierName,
    'Contact Person':                contactPerson,
    'Contact Email':                 contactEmail,
    'Phone Number':                  phone,
    'Country':                       country,
    'Status':                        status,
    'Supplier Tier':                 supplierTier,
    'Annual Production Capacity MT': annualCapacity,
    'Notes':                         notes,
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
