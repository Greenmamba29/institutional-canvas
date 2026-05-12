// Automation: Supplier Updated
// Trigger: Record updated in "Suppliers" table
// Input variables (set in Airtable automation "Input" step):
//   recordId       → Airtable record ID of the updated supplier
//   supplierName   → {Supplier Name} field value
//   status         → {Status} field value
//   country        → {Country} field value
//   certifications → {Certifications} field value (comma-separated)
//   capacity       → {Capacity (MT/yr)} field value
//   paymentTerms   → {Payment Terms Accepted} field value
//   contactEmail   → {Contact Email} field value
//   contactName    → {Contact Name} field value
// Required secrets: AIRTABLE_WEBHOOK_SECRET, SUPABASE_WEBHOOK_URL

function safe(val, fallback) {
  return (val !== null && val !== undefined && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

const config = input.config();
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl = input.secret('SUPABASE_WEBHOOK_URL');

if (!webhookSecret) {
  throw new Error('Missing AIRTABLE_WEBHOOK_SECRET secret');
}
if (!webhookUrl) {
  throw new Error('Missing SUPABASE_WEBHOOK_URL secret');
}

// Null-guard every field — Airtable passes empty strings or null for unset fields
const supplierName   = safe(config.supplierName,   'Unknown Supplier');
const recordId       = safe(config.recordId,        '');
const status         = safe(config.status,          'Pending');
const country        = safe(config.country,         '');
const certifications = safe(config.certifications,  '');
const capacity       = config.capacity ?? null;
const paymentTerms   = safe(config.paymentTerms,    '');
const contactEmail   = safe(config.contactEmail,    '');
const contactName    = safe(config.contactName,     '');

if (!recordId) {
  console.error('recordId is empty — cannot sync supplier without an Airtable record ID');
  throw new Error('Missing recordId in input config');
}

const eventName = `Supplier Updated - ${supplierName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'Suppliers',
  action: 'update',
  recordId,
  record: {
    'Supplier Name':            supplierName,
    'Status':                   status,
    'Country':                  country,
    'Certifications':           certifications ? certifications.split(',').map(s => s.trim()) : [],
    'Capacity (MT/yr)':         capacity,
    'Payment Terms Accepted':   paymentTerms,
    'Contact Email':            contactEmail,
    'Contact Name':             contactName,
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
  throw new Error(`Supplier webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully. Response: ${body}`);
