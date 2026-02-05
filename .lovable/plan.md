
# Transducer Configuration Plan: Airtable & Supabase Sync

## Overview

This plan completes the data transducer configuration by extending the existing `sync-to-airtable` Edge Function to support the new market intelligence tables, creating bidirectional sync capabilities between Make.com, Supabase, and Airtable.

## Current State Analysis

### What's Already Deployed

| Component | Status | Details |
|-----------|--------|---------|
| `make-webhook` Edge Function | Deployed | Receives Make.com updates, writes to market tables |
| `handle_make_webhook` RPC | Active | Handles `price_update`, `kpi_update`, `news_update`, `arbitrage_update`, `briefing_update` |
| `sync-to-airtable` Edge Function | Partial | Only syncs `subscriptions`, `subscription_plans`, `payments` |
| `airtable-proxy` Edge Function | Deployed | Reads FAQs and Products from Airtable |
| Market Tables | Created | `market_prices`, `market_kpis`, `market_news`, `arbitrage_opportunities`, `market_briefings` |
| Supabase Realtime | Enabled | All 5 market tables in publication |

### Configuration Gaps

| Gap | Issue | Resolution |
|-----|-------|------------|
| Airtable table mapping | `sync-to-airtable` missing market tables | Add mapping for 5 market tables |
| Missing secrets | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` not configured | User must add via Supabase secrets |
| Make.com webhook URL | Not updated in Make.com scenarios | User must update Scenario 4047120 |
| Database triggers | No auto-sync from Supabase to Airtable | Add Postgres triggers + RPC |

---

## Implementation Plan

### Phase 1: Extend sync-to-airtable Table Mapping

Update the Edge Function to support syncing market intelligence data TO Airtable.

**File**: `supabase/functions/sync-to-airtable/index.ts`

```text
Current tableMapping:
  subscriptions    -> tblCQa00kVDzzIchQ
  subscription_plans -> tblyoqlubNtFyLgG3
  payments         -> tblQsm36zVYUo4wAA

Extended tableMapping (new entries):
  market_prices    -> tbl_PRICE_ID  (user provides)
  market_kpis      -> tbl_KPI_ID    (user provides)
  market_news      -> tbl_NEWS_ID   (user provides)
  arbitrage_opportunities -> tbl_ARB_ID (user provides)
  market_briefings -> tbl_BRIEF_ID  (user provides)
```

Changes:
- Add new entries to `tableMapping` object
- Add field transformation for Airtable column naming conventions
- Add support for batch operations (multiple records per call)

---

### Phase 2: Create Supabase-to-Airtable Trigger System

Add database triggers that automatically sync changes to Airtable when market data is updated.

**New RPC Function**: `sync_market_data_to_airtable()`

```sql
-- Calls sync-to-airtable Edge Function when market tables change
CREATE FUNCTION sync_market_data_to_airtable()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://vuekwckknfjivjighhfd.supabase.co/functions/v1/sync-to-airtable',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)::jsonb,
      'action', TG_OP
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggers** (optional - can be enabled per table):
- `market_prices_sync_trigger`
- `market_kpis_sync_trigger`
- `market_news_sync_trigger`

---

### Phase 3: Create Market Data API Endpoint

Add an Edge Function to fetch data directly from Make.com Data Stores as a fallback/refresh mechanism.

**New File**: `supabase/functions/market-data/index.ts`

This function:
- Fetches from Make.com Data Store API using `MAKE_API_KEY`
- Data Store IDs: `73727` (prices), `73730` (KPIs), `73723` (news), `73728` (arbitrage)
- Writes fresh data to Supabase tables
- Returns combined market data response

---

### Phase 4: Update supabase/config.toml

Register the new `market-data` function and `sync-to-airtable` function:

```toml
[functions.sync-to-airtable]
verify_jwt = false

[functions.market-data]
verify_jwt = false
```

---

### Phase 5: Add Airtable Webhook Sync Handler

Create a handler for Airtable-initiated webhooks (when Airtable data changes push to Supabase).

**New File**: `supabase/functions/airtable-market-webhook/index.ts`

Features:
- Receives Airtable Automation webhook payloads
- Maps Airtable field names to Supabase columns
- Validates with `AIRTABLE_WEBHOOK_SECRET`
- Updates corresponding Supabase market tables

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `supabase/functions/sync-to-airtable/index.ts` | Add market table mappings + field transformers |
| CREATE | `supabase/functions/market-data/index.ts` | Make.com Data Store API fetcher |
| CREATE | `supabase/functions/airtable-market-webhook/index.ts` | Airtable -> Supabase sync handler |
| MODIFY | `supabase/config.toml` | Register new functions |
| MIGRATE | (SQL) | Add sync triggers + helper functions |

---

## Required Secrets Configuration

These secrets must be added in the Supabase Dashboard:

| Secret | Source | Purpose |
|--------|--------|---------|
| `AIRTABLE_API_KEY` | Airtable Account Settings | API access for reads/writes |
| `AIRTABLE_BASE_ID` | Airtable Base URL | Target base identifier |
| `AIRTABLE_WEBHOOK_SECRET` | User-generated | Validate incoming webhooks |
| `MAKE_API_KEY` | Make.com API Settings | Access Data Store API |

---

## Airtable Table IDs (User Must Provide)

Create these tables in Airtable and provide their IDs:

| Table Name | Fields Required |
|------------|-----------------|
| Market Prices | product_type, purity, region, price_usd, price_change_24h, market_trend |
| Dashboard KPIs | metric_name, metric_value, previous_value, change_percent |
| Market News | title, summary, source, url, sentiment, sentiment_score, category |
| Arbitrage Opportunities | product_type, buy_region, sell_region, buy_price, sell_price, profit_margin_percent |
| Market Briefings | briefing_date, executive_summary, key_highlights, price_outlook |

---

## Make.com Configuration Updates

After deployment, update these Make.com scenarios:

| Scenario ID | Current Webhook | New Webhook URL |
|-------------|-----------------|-----------------|
| 4047120 | Internal | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook` |
| 4042205 | Internal | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook` |
| 4042216 | Internal | `https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook` |

Add header to all scenarios:
```
Authorization: Bearer <SUPABASE_ANON_KEY>
```

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
