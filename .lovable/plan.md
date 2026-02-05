
# Transducer Configuration Plan: Airtable & Supabase Sync

## Overview

This plan completes the data transducer configuration by extending the existing `sync-to-airtable` Edge Function to support the new market intelligence tables, creating bidirectional sync capabilities between Make.com, Supabase, and Airtable.

## ✅ IMPLEMENTATION COMPLETE

All phases have been implemented. See implementation status below.

## Current State Analysis

### What's Now Deployed

| Component | Status | Details |
|-----------|--------|---------|
| `make-webhook` Edge Function | ✅ Deployed | Receives Make.com updates, writes to market tables |
| `handle_make_webhook` RPC | ✅ Active | Handles all 5 event types |
| `sync-to-airtable` Edge Function | ✅ Extended | Now syncs all 8 tables including market intelligence |
| `market-data` Edge Function | ✅ New | Fetches from Make.com Data Stores API |
| `airtable-market-webhook` Edge Function | ✅ New | Handles Airtable → Supabase sync |
| `airtable-proxy` Edge Function | ✅ Deployed | Reads FAQs and Products from Airtable |
| Market Tables | ✅ Created | All 5 market tables with Realtime enabled |
| Secrets | ✅ Configured | AIRTABLE_API_KEY, AIRTABLE_WEBHOOK_SECRET, MAKE_API_KEY |

---

## Implementation Status

### ✅ Phase 1: Extend sync-to-airtable Table Mapping

Extended `supabase/functions/sync-to-airtable/index.ts` with:
- Added 5 new market table mappings
- Added field transformers for Airtable column naming
- Added batch operation support

```typescript
const tableMapping = {
  // Existing
  subscriptions    -> tblCQa00kVDzzIchQ
  subscription_plans -> tblyoqlubNtFyLgG3
  payments         -> tblQsm36zVYUo4wAA
  // New market tables (configurable via env vars)
  market_prices    -> AIRTABLE_MARKET_PRICES_TABLE
  market_kpis      -> AIRTABLE_MARKET_KPIS_TABLE
  market_news      -> AIRTABLE_MARKET_NEWS_TABLE
  arbitrage_opportunities -> AIRTABLE_ARBITRAGE_TABLE
  market_briefings -> AIRTABLE_BRIEFINGS_TABLE
}
```

---

### ⏳ Phase 2: Database Triggers (Optional)

Database triggers for automatic sync can be added via migration if needed.
Currently, sync is triggered via Edge Function calls from Make.com webhooks.

---

### ✅ Phase 3: Market Data API Endpoint

Created `supabase/functions/market-data/index.ts`:
- Fetches from Make.com Data Store API
- Data Store IDs: 73727 (prices), 73730 (KPIs), 73723 (news), 73728 (arbitrage)
- Syncs to Supabase tables
- Supports filtering by type: `?type=prices|kpis|news|arbitrage|all`

**Usage:**
```
GET https://vuekwckknfjivjighhfd.supabase.co/functions/v1/market-data
GET https://vuekwckknfjivjighhfd.supabase.co/functions/v1/market-data?type=prices
```

---

### ✅ Phase 4: Config Updated

`supabase/config.toml` now includes:

```toml
[functions.sync-to-airtable]
verify_jwt = false

[functions.market-data]
verify_jwt = false

[functions.airtable-market-webhook]
verify_jwt = false
```

---

### ✅ Phase 5: Airtable Webhook Handler

Created `supabase/functions/airtable-market-webhook/index.ts`:
- Receives Airtable Automation webhook payloads
- Maps Airtable field names to Supabase columns
- Validates with `AIRTABLE_WEBHOOK_SECRET`
- Supports both simple automation and Webhooks API formats

**Webhook URL:**
```
https://vuekwckknfjivjighhfd.supabase.co/functions/v1/airtable-market-webhook
```

---

## Files Created/Modified

| Action | File | Status |
|--------|------|--------|
| MODIFIED | `supabase/functions/sync-to-airtable/index.ts` | ✅ Complete |
| CREATED | `supabase/functions/market-data/index.ts` | ✅ Complete |
| CREATED | `supabase/functions/airtable-market-webhook/index.ts` | ✅ Complete |
| MODIFIED | `supabase/config.toml` | ✅ Complete |

---

## Secrets Configured

| Secret | Status |
|--------|--------|
| `AIRTABLE_API_KEY` | ✅ Added |
| `AIRTABLE_WEBHOOK_SECRET` | ✅ Added |
| `MAKE_API_KEY` | ✅ Added |

---

## Next Steps (User Action Required)

### 1. Create Airtable Tables
Create these tables in your Airtable base and optionally set table IDs as env vars:

| Table Name | Fields Required |
|------------|-----------------|
| Market Prices | product_type, purity, region, price_usd, price_change_24h, market_trend |
| Dashboard KPIs | metric_name, metric_value, previous_value, change_percent |
| Market News | title, summary, source, url, sentiment, sentiment_score, category |
| Arbitrage Opportunities | product_type, buy_region, sell_region, buy_price, sell_price, profit_margin_percent |
| Market Briefings | briefing_date, executive_summary, key_highlights, price_outlook |

---

### 2. Update Make.com Scenarios

Update webhook URLs in these scenarios:

| Scenario ID | Current Webhook | New Webhook URL |
|-------------|-----------------|-----------------|
| 4047120 | Internal | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook` |
| 4042205 | Internal | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook` |
| 4042216 | Internal | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook` |

Add header to all scenarios:
```
Authorization: Bearer <SUPABASE_ANON_KEY>
```

### 3. Set Up Airtable Automation (Optional)

To sync Airtable changes back to Supabase:
1. Create an Airtable Automation for each table
2. Trigger: When record created/updated/deleted
3. Action: Send webhook to:
   ```
   https://vuekwckknfjivjighhfd.supabase.co/functions/v1/airtable-market-webhook
   ```
4. Include header: `x-airtable-signature: <AIRTABLE_WEBHOOK_SECRET>`

---

## Data Flow Architecture

```text
INBOUND (Make.com -> Supabase -> Airtable):
┌────────────┐    webhook    ┌──────────────┐    trigger    ┌────────────┐
│  Make.com  │ ───────────>  │  Supabase    │ ────────────> │  Airtable  │
│  Scenarios │    /make-     │  DB Tables   │   /sync-to-   │   Base     │
│  4047120   │    webhook    │  market_*    │   airtable    │            │
└────────────┘               └──────────────┘               └────────────┘

OUTBOUND (Airtable -> Supabase):
┌────────────┐   automation  ┌──────────────┐
│  Airtable  │ ───────────>  │  Supabase    │
│  Webhook   │  /airtable-   │  DB Tables   │
│            │  market-      │  market_*    │
└────────────┘  webhook      └──────────────┘
```

---

## Success Criteria

1. Market data flows from Make.com to Supabase via `make-webhook`
2. Supabase changes sync to Airtable via `sync-to-airtable` triggers
3. Airtable changes sync back to Supabase via `airtable-market-webhook`
4. All secrets are properly configured in Supabase Dashboard
5. Make.com scenarios updated with new webhook URLs
6. Dashboard displays live data with Realtime updates
