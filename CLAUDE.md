# institutional-canvas — Developer Guide

## Architecture

Dual-write pattern: Supabase is the source of truth for all transactional data. Airtable serves as the operational dashboard / CRM layer. Data flows:

- **Supabase → Airtable**: `sync-to-airtable` edge function (triggered by database webhooks or direct calls)
- **Airtable → Supabase**: `airtable-market-webhook` edge function (Airtable Automations POST to this endpoint)
- **Frontend → Supabase**: direct Supabase client with RLS
- **Frontend → Airtable CRUD**: `airtable-crud` edge function (subscription-gated)
- **Frontend → Grant intelligence**: `airtable-grants` edge function (JWT required)

## Subscription Tiers

| Feature | Pro ($599/mo) | Enterprise ($4,999/mo) |
|---------|--------------|----------------------|
| Grants tracker | ✓ | ✓ |
| Eligibility engine | ✓ | ✓ |
| Readiness dashboard | ✓ | ✓ |
| Evidence vault | ✓ | ✓ |
| Partner matching | — | ✓ |
| Funding pipeline | — | ✓ |
| Auction system | — | ✓ |
| API + webhooks | — | ✓ |

Admin org type bypasses all subscription checks.

## Environment Variables

### Supabase (local .env.local)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Stripe (local .env.local)
```
VITE_STRIPE_PUBLISHABLE_KEY=
```

### Set as Supabase Edge Function secrets (never in files)
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
supabase secrets set STRIPE_SECRET_KEY=xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=xxx
supabase secrets set AIRTABLE_API_KEY=pat_xxx
supabase secrets set AIRTABLE_BASE_ID=appu9fRT4qFBCf8wL
supabase secrets set AIRTABLE_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

## Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql` or `YYYYMMDD000000_description.sql` for date-scoped migrations.

## Edge Functions

| Function | JWT Required | Purpose |
|----------|-------------|---------|
| airtable-proxy | yes | Proxy Airtable reads to frontend |
| airtable-crud | no* | Full CRUD with subscription gating |
| airtable-grants | yes | Grant intelligence actions |
| airtable-market-webhook | no | Inbound webhook from Airtable |
| sync-to-airtable | no | Write Supabase data to Airtable |
| stripe-webhook | no | Stripe event processing |

*airtable-crud validates the JWT manually inside the handler.

## Feature Flags

Feature flags live in `src/policy/featureFlags.ts`. To enable a flag for an org:
```sql
INSERT INTO org_feature_flags (org_id, flag_name, enabled)
VALUES ('org-uuid', 'GRANT_TRACKER', true);
```

## Development

```bash
npm install
npm run dev           # starts Vite dev server
npx tsc --noEmit     # type check only
supabase start        # local Supabase stack
supabase functions serve airtable-grants  # local edge function
```

## Recycling & Compliance Module

LithiumBuy Phase 2 adds a Critical Minerals Recycling & Compliance OS.

### Regulatory Framework
- **Federal**: Mercury-Containing and Rechargeable Battery Management Act, EPA RCRA universal waste rules
- **California**: AB 2440 (e-waste fees on battery products), SB 1215
- **New Jersey**: Electric and Hybrid Vehicle Battery Management Act — producer registration 2025, reporting 2026, disposal ban 2027
- **Washington**: SB 5144 — EPR stewardship organizations required by 2027
- **EU**: Battery Regulation 2023/1542 — minimum recycled content (12% cobalt, 4% lithium, 4% nickel by 2030), mandatory labeling 2025–27

### Compliance Tables (Supabase)
| Table | Purpose | RLS |
|-------|---------|-----|
| collection_sites | Battery drop-off/pickup locations | Public read |
| collection_workers | Field collectors with KYC/training status | Own org |
| battery_inventory | Individual battery records with chain tracking | Own org |
| chain_of_custody | Transfer events for each battery | Own org |
| processing_orders | Processor intake and output records | Own org |
| compliance_audit_logs | Regulatory compliance audit trail | Own org |

### Airtable Webhook URLs
```
Compliance data:  https://<project>.supabase.co/functions/v1/airtable-compliance-webhook
Grant data:       https://<project>.supabase.co/functions/v1/airtable-grant-webhook
Market data:      https://<project>.supabase.co/functions/v1/airtable-market-webhook
```

### Setting Up Airtable Automations
1. In your Airtable base, go to Automations
2. Create automation: Trigger = "When a record is updated"
3. Action = "Send webhook" → POST to the appropriate URL above
4. Headers: `x-airtable-signature: <your webhook secret>` and `Content-Type: application/json`
5. Body format: `{ "table": "<TableName>", "action": "update", "record": <fields>, "recordId": "<id>" }`

### Cron Jobs
The `close-auctions` function runs every 5 minutes. When calling it manually, pass:
```bash
curl -X POST <fn-url> -H "x-cron-secret: $CRON_SECRET"
```

### Flash Alert Flow
Airtable (Flash_Alerts table) → `airtable-grant-webhook` → Supabase `flash_alerts` insert → Supabase Realtime → `useFlashAlerts` hook → `FlashAlertBanner` component
