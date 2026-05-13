// ─────────────────────────────────────────────────────────────────────────────
// Automation: Buyer Organization Updated
// Trigger:    When record is updated in "Buyer Organizations" table
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  /  SUPABASE_WEBHOOK_URL  /  SUPABASE_ANON_KEY
//
// Input variables:
//   recordId          →  Record ID
//   orgName           →  Organization Name
//   mainContactName   →  Main Contact Name
//   mainContactEmail  →  Main Contact Email
//   phone             →  Phone Number
//   country           →  Country
//   industry          →  Industry
//   orgType           →  Organization Type
//   status            →  Status
//   buyerTier         →  Buyer Tier
//   region            →  Region
//   annualVolume      →  Annual Procurement Volume MT
//   annualBudget      →  Annual Budget USD
//   notes             →  Notes
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
const recordId         = safe(config.recordId);
const orgName          = safe(config.orgName, 'Unknown Organization');
const mainContactName  = safe(config.mainContactName);
const mainContactEmail = safe(config.mainContactEmail);
const phone            = safe(config.phone);
const country          = safe(config.country);
const industry         = safe(config.industry);
const orgType          = safe(config.orgType);
const status           = safe(config.status, 'Active');
const buyerTier        = safe(config.buyerTier);
const region           = safe(config.region);
const notes            = safe(config.notes);
const annualVolume     = config.annualVolume  ?? null;
const annualBudget     = config.annualBudget  ?? null;

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const eventName = `Buyer Organization Updated - ${orgName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'Buyer_Organizations',
  action:    'update',
  recordId,
  record: {
    'Organization Name':             orgName,
    'Main Contact Name':             mainContactName,
    'Main Contact Email':            mainContactEmail,
    'Phone Number':                  phone,
    'Country':                       country,
    'Industry':                      industry,
    'Organization Type':             orgType,
    'Status':                        status,
    'Buyer Tier':                    buyerTier,
    'Region':                        region,
    'Annual Procurement Volume MT':  annualVolume,
    'Annual Budget USD':             annualBudget,
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
