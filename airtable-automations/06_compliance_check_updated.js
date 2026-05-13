// ─────────────────────────────────────────────────────────────────────────────
// Automation: Compliance Check Updated
// Trigger:    When record is updated in "Compliance Checks" table
//
// Secrets:
//   AIRTABLE_WEBHOOK_SECRET  /  SUPABASE_WEBHOOK_URL  /  SUPABASE_ANON_KEY
//
// Input variables:
//   recordId          →  Record ID
//   checkName         →  Check Name
//   typeOfCheck       →  Type of Check
//   performedBy       →  Performed By
//   checkDate         →  Check Date
//   result            →  Result
//   checkStatus       →  Check Status
//   checkCategory     →  Check Category
//   riskLevel         →  Risk Level
//   riskScore         →  Risk Score
//   expiryDate        →  Expiry Date
//   nextReviewDate    →  Next Review Date
//   remediationRequired → Remediation Required
//   findingsSummary   →  Findings Summary
//   approvedBy        →  Approved By
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
const recordId           = safe(config.recordId);
const checkName          = safe(config.checkName, 'Unnamed Check');
const typeOfCheck        = safe(config.typeOfCheck);
const performedBy        = safe(config.performedBy);
const checkDate          = safe(config.checkDate);
const result             = safe(config.result, 'Pending');
const checkStatus        = safe(config.checkStatus);
const checkCategory      = safe(config.checkCategory);
const riskLevel          = safe(config.riskLevel);
const expiryDate         = safe(config.expiryDate);
const nextReviewDate     = safe(config.nextReviewDate);
const findingsSummary    = safe(config.findingsSummary);
const approvedBy         = safe(config.approvedBy);
const notes              = safe(config.notes);
const riskScore          = config.riskScore ?? null;
const remediationRequired= config.remediationRequired ?? false;

if (!recordId) throw new Error('recordId is empty — check input variable mapping');

const eventName = `Compliance Check Updated - ${checkName}`;
console.log(`Processing: ${eventName}`);

const payload = {
  _secret:   webhookSecret,
  table:     'Compliance Checks',
  action:    'update',
  recordId,
  record: {
    'Check Name':            checkName,
    'Type of Check':         typeOfCheck,
    'Performed By':          performedBy,
    'Check Date':            checkDate         || null,
    'Result':                result,
    'Check Status':          checkStatus,
    'Check Category':        checkCategory,
    'Risk Level':            riskLevel,
    'Risk Score':            riskScore,
    'Expiry Date':           expiryDate        || null,
    'Next Review Date':      nextReviewDate    || null,
    'Remediation Required':  remediationRequired,
    'Findings Summary':      findingsSummary,
    'Approved By':           approvedBy,
    'Notes':                 notes,
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
