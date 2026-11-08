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
supabase secrets set AIRTABLE_GRANT_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set AIRTABLE_COMPLIANCE_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set CRON_SECRET=<value>          # also store in Vault, see Cron Jobs
supabase secrets set ALLOWED_ORIGINS=https://*.vercel.app   # optional extra CORS origins
```

All webhook and cron secrets **fail closed**: if a secret is unset, the
function rejects every request (503) instead of letting it through.

## Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql` or `YYYYMMDD000000_description.sql` for date-scoped migrations.

## Edge Functions

All functions set `verify_jwt = false` in `supabase/config.toml` and check the
caller inside the handler. Shared helpers live in
`supabase/functions/_shared/` (`security.ts`, `sync-policy.ts`, `refresh-throttle.ts`).
Tests: `deno test --allow-env supabase/functions/_shared/` and, for handlers with
the network faked, `deno test --allow-env --allow-read --no-check --import-map=supabase/functions/_tests/import_map.json supabase/functions/_tests/`.

| Function | Caller check (in handler) | Purpose |
|----------|---------------------------|---------|
| airtable-proxy | user JWT | Proxy Airtable reads to frontend |
| airtable-crud | user JWT + subscription | Full CRUD with subscription gating |
| airtable-grants | user JWT | Grant intelligence actions |
| sync-to-airtable | service role, or user JWT limited to rfqs/bids/deals/purchases/custody_events/telebuy_sessions/auctions/auction_bids, create/update only, rows the user can read (re-read under RLS; upserts on the Supabase id) | Write Supabase data to Airtable |
| setup-airtable-auctions | super admin or service role | One-off Airtable schema setup |
| airtable-market-webhook | `x-webhook-token` = `AIRTABLE_WEBHOOK_SECRET` (or HMAC in `x-airtable-signature`) | Inbound webhook from Airtable |
| airtable-grant-webhook | `x-webhook-token` = `AIRTABLE_GRANT_WEBHOOK_SECRET` | Inbound webhook from Airtable |
| airtable-compliance-webhook | `x-webhook-token` = `AIRTABLE_COMPLIANCE_WEBHOOK_SECRET` | Inbound webhook from Airtable |
| close-auctions, airtable-pull-sync, airtable-push-sync, grant-ingest | service role or `x-cron-secret` = `CRON_SECRET` | Scheduled jobs |
| market-intel-ingest | service role / `x-cron-secret`, or user JWT throttled to one run per `USER_REFRESH_MIN_MINUTES` (default 15) across all users | Scheduled + on-demand market data |
| stripe-webhook | Stripe signature | Stripe event processing |

CORS: every function is wrapped in `withCors`, which only echoes origins on the
allowlist (lithiumbuy.com, www, localhost:8080, plus `ALLOWED_ORIGINS`).

New SECURITY DEFINER SQL functions get PUBLIC execute by default. Every
migration that creates one must `REVOKE EXECUTE ... FROM PUBLIC, anon` and
`GRANT EXECUTE ... TO authenticated` (see `20261107000200_*`).

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
- **EU**: Battery Regulation 2023/1542 — minimum recycled content (verify figures with counsel: the regulation text reads 16% cobalt, 6% lithium, 6% nickel from 2031), mandatory labeling 2025–27

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
4. Headers: `x-webhook-token: <the matching webhook secret>` and `Content-Type: application/json`
   (market: `AIRTABLE_WEBHOOK_SECRET`, grant: `AIRTABLE_GRANT_WEBHOOK_SECRET`, compliance: `AIRTABLE_COMPLIANCE_WEBHOOK_SECRET`)
5. Body format: `{ "table": "<TableName>", "action": "update", "record": <fields>, "recordId": "<id>" }`

### Cron Jobs
pg_cron calls close-auctions (every 5 min), airtable-pull-sync and airtable-push-sync
(15 min), market-intel-ingest (30 min) and grant-ingest (daily). Each job sends
`x-cron-secret` read from Supabase Vault (migration `20261107000100_*`). One-time setup,
same value in both places:
```bash
supabase secrets set CRON_SECRET=<value>
```
```sql
select vault.create_secret('<value>', 'cron_secret');
```
When calling a job manually, pass:
```bash
curl -X POST <fn-url> -H "x-cron-secret: $CRON_SECRET"
```

### Flash Alert Flow
Airtable (Flash_Alerts table) → `airtable-grant-webhook` → Supabase `flash_alerts` insert → Supabase Realtime → `useFlashAlerts` hook → `FlashAlertBanner` component
