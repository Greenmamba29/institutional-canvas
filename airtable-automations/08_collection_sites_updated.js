// ─────────────────────────────────────────────────────────────────────────────
// Automation: Collection Site Updated  ← REPLACE existing script with this
// Trigger:    When record is updated in "Collection_Sites" table
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  /  SUPABASE_WEBHOOK_URL  /  SUPABASE_ANON_KEY
//
// Input variables:
//   recordId          →  Record ID
//   siteId            →  Site_ID
//   siteName          →  Site_Name
//   location          →  Location
//   country           →  Country
//   region            →  Region
//   siteType          →  Site_Type
//   capacityMt        →  Capacity_MT
//   siteStatus        →  Status
//   managerName       →  Manager_Name
//   contactEmail      →  Contact_Email
//   contactPhone      →  Contact_Phone
//   complianceStatus  →  Compliance_Status
//   lastInspection    →  Last_Inspection
//   nextInspection    →  Next_Inspection
//   notes             →  Notes
//   supabaseId        →  Supabase_ID
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
const siteId           = safe(config.siteId);
const siteName         = safe(config.siteName, 'Unknown Site');
const location         = safe(config.location);
const country          = safe(config.country);
const region           = safe(config.region);
const siteType         = safe(config.siteType);
const siteStatus       = safe(config.siteStatus, 'Active');
const managerName      = safe(config.managerName);
const contactEmail     = safe(config.contactEmail);
const contactPhone     = safe(config.contactPhone);
const complianceStatus = safe(config.complianceStatus, 'Pending');
const lastInspection   = safe(config.lastInspection);
const nextInspection   = safe(config.nextInspection);
const notes            = safe(config.notes);
const supabaseId       = safe(config.supabaseId);
const capacityMt       = config.capacityMt ?? null;

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const eventName = `Collection Site Updated - ${siteName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'Collection_Sites',
  action:    'update',
  recordId,
  record: {
    'Site_ID':           siteId,
    'Site_Name':         siteName,
    'Location':          location,
    'Country':           country,
    'Region':            region,
    'Site_Type':         siteType,
    'Capacity_MT':       capacityMt,
    'Status':            siteStatus,
    'Manager_Name':      managerName,
    'Contact_Email':     contactEmail,
    'Contact_Phone':     contactPhone,
    'Compliance_Status': complianceStatus,
    'Last_Inspection':   lastInspection   || null,
    'Next_Inspection':   nextInspection   || null,
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
