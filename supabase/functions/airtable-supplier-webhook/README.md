# Airtable Supplier Webhook

Edge Function to sync supplier verification data from Airtable to Supabase.

## Setup

1. **Deploy the function:**
```bash
supabase functions deploy airtable-supplier-webhook
```

2. **Set environment variables:**
```bash
supabase secrets set AIRTABLE_WEBHOOK_SECRET=your_webhook_secret
```

3. **Configure Airtable webhook:**
   - Go to Airtable Automation
   - Create webhook trigger
   - Set URL: `https://<project-ref>.supabase.co/functions/v1/airtable-supplier-webhook`
   - Add header: `x-airtable-webhook-secret: your_webhook_secret`

## Webhook Payload Structure

The function expects Airtable webhook payloads with the following structure:
- `eventType`: 'create' | 'update' | 'delete'
- `payload.changedTablesById`: Object mapping table IDs to changed records
- `payload.changedTablesById[tableId].changedRecordsById`: Object mapping record IDs to changes

## Supported Tables

- **Suppliers**: Syncs to `suppliers` table
- **Compliance Checks**: Syncs compliance data (TODO)
- **SOE Organizations**: Syncs SOE org data (TODO)

## Field Mapping

Airtable fields are mapped to Supabase columns:
- `Company Name` / `Name` → `suppliers.name`
- `Verification Tier` / `Tier` → `suppliers.verification_tier`
- `KYB Status` / `Status` → `suppliers.kyb_status`
- `Certifications` → `suppliers.certifications`
- `Performance Score` / `Score` → `suppliers.performance_score`

## Testing

Test the webhook locally:
```bash
supabase functions serve airtable-supplier-webhook
```

Then send a test payload:
```bash
curl -X POST http://localhost:54321/functions/v1/airtable-supplier-webhook \
  -H "Content-Type: application/json" \
  -H "x-airtable-webhook-secret: your_secret" \
  -d @test-payload.json
```
