# Skill: Airtable Record Update → Supabase Webhook Automation

## Overview
This skill covers how to build, fix, and maintain Airtable automations that fire a secure webhook
to a Supabase edge function whenever a record is created or updated.

---

## Required Secrets (must exist in every automation's script)

| Secret Name             | Purpose                                              |
|-------------------------|------------------------------------------------------|
| `AIRTABLE_WEBHOOK_SECRET` | Shared secret to authenticate Airtable → Supabase  |
| `SUPABASE_WEBHOOK_URL`    | Full URL of the Supabase edge function endpoint     |
| `SUPABASE_API_KEY`        | Supabase anon/service-role key for Authorization    |

### Adding Secrets
1. In the script editor, scroll to **Secrets** in the left panel
2. Click **Add existing secret** → select from dropdown
3. If not present, click **Add new secret**, enter Name + value, save

---

## Standard Script Template

```javascript
const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const supabaseUrl   = input.secret('SUPABASE_WEBHOOK_URL');
const supabaseApiKey = input.secret('SUPABASE_API_KEY');

const record = input.config();

const response = await fetch(supabaseUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseApiKey}`,
    'x-webhook-secret': webhookSecret
  },
  body: JSON.stringify(record)
});

const text = await response.text();
console.log('Status:', response.status);
console.log('Response:', text);
```

---

## Step-by-Step Workflow (Per Automation)

1. **Open** the automation in Airtable > Automations
2. **Click** on the "Run a script" action block
3. **Click** `<> Edit code` in the Properties panel
4. **Scroll** to Secrets — verify all 3 are present; add any missing ones
5. **Click** in the Code panel, press `Cmd+A` to select all
6. **Paste** the standard script template above
7. **Click** `Test` — wait for green ✅ "Test ran successfully"
8. **Verify** output shows `Status: 200` and `{"success":true,"message":"Webhook processed"}`
9. **Click** `Finish editing`
10. **Click** `Update` to publish the live automation

---

## Critical Rules

| Rule | Detail |
|------|--------|
| ✅ Authorization header | Must use `Bearer ${supabaseApiKey}` — NOT the webhook secret |
| ✅ x-webhook-secret header | Uses `AIRTABLE_WEBHOOK_SECRET` for Supabase to validate origin |
| ❌ Never use AIRTABLE_WEBHOOK_SECRET in Authorization | This causes 401 Unauthorized |
| ❌ Never use SUPABASE_ANON_KEY as a separate secret name | Use SUPABASE_API_KEY consistently |

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Wrong key in Authorization header | Use SUPABASE_API_KEY in Bearer token |
| Script fails silently | Missing secret(s) | Ensure all 3 secrets are registered in the script editor |
| "Test ran successfully" but no DB insert | Supabase edge function logic issue | Check Supabase function logs |
| Changes not live | Forgot to click Update | Always click Update after editing |

---

## Automations Fixed (LithiumBuy Dashboard)

| Automation | Trigger | Status |
|---|---|---|
| Market Prices Update Webhook | Record updated | ✅ ON |
| Dashboard KPIs Update Webhook | Record updated | ✅ ON |
| Market News Record Update Webhook | Record updated | ✅ ON |
| Arbitrage Opportunities Update Webhook | Record updated | ✅ ON |
| Market Briefings Webhook | Record updated | ✅ ON |
| Flash Alerts Webhook | Record updated | ✅ ON |
| Supplier Record Update Webhook | Record updated | ✅ ON |
| Deals Record Update Webhook | Record updated | ✅ ON |
| RFQ Record Update Webhook | Record updated | ✅ ON |
| Compliance Checks Record Update Webhook | Record updated | ✅ ON |
| KYC AML Records Update Webhook | Record updated | ✅ ON |
| Update Buyer Organizations Record Webhook | Record updated | ✅ ON |
| Collection_Sites Record Update Webhook | Record updated | ✅ ON |
| Compliance Audit Logs Webhook | Record created | ✅ ON |
| Market Prices Update to Supabase Webhook | Record updated | ✅ ON |

---

## Notes on the 8 Full Automation Scripts

For automations that pass rich record data (not just a raw `input.config()` passthrough),
the full scripts live in `airtable-automations/` at the repo root:

| File | Automation |
|------|-----------|
| `01_market_intelligence_sync.js` | Scheduled batch sync — Market Prices, KPIs, News, Arbitrage |
| `02_supplier_updated.js` | Suppliers table |
| `03_rfq_updated.js` | RFQs table |
| `04_buyer_organization_updated.js` | Buyer Organizations table |
| `05_deal_updated.js` | Deals table |
| `06_compliance_check_updated.js` | Compliance Checks table |
| `07_introduction_created_updated.js` | Introductions table (create + update) |
| `08_collection_sites_updated.js` | Collection_Sites table |

These use `SUPABASE_API_KEY` (not `SUPABASE_ANON_KEY`) and send both
`Authorization: Bearer` and `apikey` headers to satisfy Supabase's API gateway.

## Secret Values (LithiumBuy project)

| Secret | Value |
|--------|-------|
| `SUPABASE_WEBHOOK_URL` | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/airtable-market-webhook` |
| `SUPABASE_API_KEY` | Supabase anon key — retrieve from Supabase Dashboard → Settings → API |
