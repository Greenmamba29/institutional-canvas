// Automation: Buyer Organization Updated
// Trigger: Record updated in "Buyer Organizations" table
// Input variables:
//   recordId       → {Record ID}
//   orgName        → {Organization Name}
//   contactPerson  → {Contact Person}
//   contactEmail   → {Contact Email}
//   phone          → {Phone}
//   country        → {Country}
//   orgStatus      → {Status}
//   orgType        → {Organization Type}
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

const recordId      = safe(config.recordId,      '');
const orgName       = safe(config.orgName,       'Unknown Organization');
const contactPerson = safe(config.contactPerson, '');
const contactEmail  = safe(config.contactEmail,  '');
const phone         = safe(config.phone,         '');
const country       = safe(config.country,       '');
const orgStatus     = safe(config.orgStatus,     'Active');
const orgType       = safe(config.orgType,       'buyer');
const notes         = safe(config.notes,         '');

if (!recordId) {
  throw new Error('Missing recordId in input config');
}

const eventName = `Buyer Organization Updated - ${orgName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'Buyer_Organizations',
  action: 'update',
  recordId,
  record: {
    'Organization Name': orgName,
    'Contact Person':    contactPerson,
    'Contact Email':     contactEmail,
    'Phone':             phone,
    'Country':           country,
    'Status':            orgStatus,
    'Organization Type': orgType,
    'Notes':             notes,
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
  throw new Error(`Buyer Organization webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully.`);
