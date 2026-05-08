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
