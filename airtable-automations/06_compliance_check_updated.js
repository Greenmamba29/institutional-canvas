// Automation: Compliance Check Updated
// Trigger: Record updated in "Compliance Checks" table
// Input variables:
//   recordId      → {Record ID}
//   checkName     → {Check Name}
//   performedBy   → {Performed By}
//   checkDate     → {Check Date}
//   result        → {Result}
//   expiryDate    → {Expiry Date}
//   linkedOrg     → {Linked Organization}
//   notes         → {Notes}
//   checkType     → {Check Type}
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
const checkName  = safe(config.checkName,  'Unnamed Check');
const performedBy= safe(config.performedBy,'');
const checkDate  = safe(config.checkDate,  '');
const result     = safe(config.result,     'Pending');
const expiryDate = safe(config.expiryDate, '');
const linkedOrg  = safe(config.linkedOrg,  '');
const notes      = safe(config.notes,      '');
const checkType  = safe(config.checkType,  '');

if (!recordId) {
  throw new Error('Missing recordId in input config');
}

const eventName = `Compliance Check Updated - ${checkName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret: webhookSecret,
  table: 'Compliance Checks',
  action: 'update',
  recordId,
  record: {
    'Check Name':           checkName,
    'Performed By':         performedBy,
    'Check Date':           checkDate  || null,
    'Result':               result,
    'Expiry Date':          expiryDate || null,
    'Linked Organization':  linkedOrg,
    'Notes':                notes,
    'Check Type':           checkType,
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
  throw new Error(`Compliance Check webhook failed: ${response.status} — ${body}`);
}

console.log(`${eventName} → synced successfully.`);
