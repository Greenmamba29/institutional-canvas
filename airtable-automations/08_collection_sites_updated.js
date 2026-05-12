// Automation: Collection Sites Updated  ← SWAP IN: replaces existing broken script
// Trigger: Record updated in "Collection_Sites" table
// Input variables:
//   recordId          → {Record ID}
//   siteId            → {Site_ID}
//   siteName          → {Site_Name}
//   location          → {Location}
//   country           → {Country}
//   region            → {Region}
//   siteType          → {Site_Type}
//   capacityMt        → {Capacity_MT}
//   siteStatus        → {Status}
//   managerName       → {Manager_Name}
//   contactEmail      → {Contact_Email}
//   contactPhone      → {Contact_Phone}
//   complianceStatus  → {Compliance_Status}
//   lastInspection    → {Last_Inspection}
//   nextInspection    → {Next_Inspection}
//   notes             → {Notes}
// Required secrets: AIRTABLE_WEBHOOK_SECRET, SUPABASE_WEBHOOK_URL

function safe(val, fallback) {
  return (val !== null && val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

const config = input.config();
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl = input.secret('SUPABASE_WEBHOOK_URL');

if (!webhookSecret) throw new Error('Missing AIRTABLE_WEBHOOK_SECRET secret');
if (!webhookUrl)    throw new Error('Missing SUPABASE_WEBHOOK_URL secret');

const recordId         = safe(config.recordId,         '');
const siteId           = safe(config.siteId,           '');
const siteName         = safe(config.siteName,         'Unknown Site');
const location         = safe(config.location,         '');
const country          = safe(config.country,          '');
const region           = safe(config.region,           '');
const siteType         = safe(config.siteType,         '');
const siteStatus       = safe(config.siteStatus,       'Active');
const managerName      = safe(config.managerName,      '');
const contactEmail     = safe(config.contactEmail,     '');
const contactPhone     = safe(config.contactPhone,     '');
const complianceStatus = safe(config.complianceStatus, 'Pending');
const lastInspection   = safe(config.lastInspection,   '');
const nextInspection   = safe(config.nextInspection,   '');
const notes            = safe(config.notes,            '');
const capacityMt       = config.capacityMt ?? null;

if (!recordId) {
  throw new Error('Missing recordId in input config');
}

const eventName = `Collection Site Updated - ${siteName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'Collection_Sites',
  action: 'update',
  recordId,
  record: {
    'Site_ID':            siteId,
    'Site_Name':          siteName,
    'Location':           location,
    'Country':            country,
    'Region':             region,
    'Site_Type':          siteType,
    'Capacity_MT':        capacityMt,
    'Status':             siteStatus,
    'Manager_Name':       managerName,
    'Contact_Email':      contactEmail,
    'Contact_Phone':      contactPhone,
    'Compliance_Status':  complianceStatus,
    'Last_Inspection':    lastInspection  || null,
    'Next_Inspection':    nextInspection  || null,
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
  throw new Error(`Collection Site webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully.`);
