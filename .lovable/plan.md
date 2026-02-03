
# Market Intelligence Integration Plan

## Overview

This plan integrates the uploaded **Lithium & Lux Market Intelligence** handoff package into the LithiumBuy codebase. The package provides real-time market data (prices, KPIs, news, arbitrage opportunities) powered by Make.com/Perplexity AI and streamed via Supabase Realtime.

## Architecture

```text
Make.com (Perplexity AI)
         |
         v (Webhook every 5 min)
+---------------------+
| make-webhook        | <-- New Edge Function
| (Supabase)          |
+---------------------+
         |
         v (Writes to DB)
+---------------------+
| Supabase Tables     | <-- 5 new tables
| - market_prices     |
| - dashboard_kpis    |
| - market_news       |
| - arbitrage_opps    |
| - market_briefings  |
+---------------------+
         |
         v (Realtime broadcast)
+---------------------+
| useMarketData Hook  | <-- New React hook with Realtime subscriptions
+---------------------+
         |
         v
+---------------------+
| Dashboard/UI        | <-- Enhanced with live market data
+---------------------+
```

## Implementation Steps

### Phase 1: Database Migration (SQL)

**Action**: Run migration to create 5 new market intelligence tables

Creates:
- `market_prices` - Live lithium pricing by region/product
- `dashboard_kpis` - Key performance indicators (suppliers, buyers, auctions, etc.)
- `market_news` - AI-curated news with sentiment analysis
- `arbitrage_opportunities` - Cross-regional price arbitrage detection
- `market_briefings` - Daily AI-generated market summaries

Includes:
- Indexes for performance
- RLS policies (public read, service role write)
- Realtime publication for all tables
- Seed data for immediate demo capability
- `handle_make_webhook()` RPC function for processing Make.com payloads
- `cleanup_old_data()` and `get_market_summary()` utility functions

### Phase 2: Edge Function Deployment

**Files to create**:

| File | Purpose |
|------|---------|
| `supabase/functions/make-webhook/index.ts` | Receives Make.com webhooks, calls `handle_make_webhook()` RPC |

**Configuration**:
- Add to `supabase/config.toml`: `[functions.make-webhook]` with `verify_jwt = false`

### Phase 3: React Hook Integration

**Files to create**:

| File | Purpose |
|------|---------|
| `src/hooks/useMarketData.ts` | Full market data hook with Supabase Realtime subscriptions |

**Hook exports**:
- `useMarketData()` - Combined hook for all market data
- `useKPIs()` - Dashboard KPIs with realtime
- `usePrices()` - Market prices with realtime
- `useNews()` - News items with realtime
- `useArbitrage()` - Arbitrage opportunities with realtime
- Utility functions: `formatCurrency()`, `formatPercent()`, `getTrendColor()`, etc.

### Phase 4: Dashboard Enhancement

**File to modify**: `src/pages/Dashboard.tsx`

Add new components powered by `useMarketData`:
- Live price ticker with regional breakdown
- Market news feed with sentiment indicators
- Arbitrage opportunities panel
- Enhanced KPIs from Make.com/Perplexity

### Phase 5: Types Integration

**Note**: The Supabase types file (`src/integrations/supabase/types.ts`) is auto-generated and cannot be modified directly. The `useMarketData` hook includes its own TypeScript interfaces that will work independently until the types are regenerated after the migration.

---

## Technical Details

### Database Tables Schema

```sql
-- market_prices
id UUID PRIMARY KEY
product_type TEXT NOT NULL        -- "Lithium Carbonate", "Lithium Hydroxide", etc.
purity TEXT                       -- "battery_grade", "technical_grade"
region TEXT NOT NULL              -- "Asia", "Europe", "Americas"
price_usd DECIMAL(12,2)
price_change_24h DECIMAL(6,2)
market_trend TEXT                 -- "up", "down", "stable"
confidence_score DECIMAL(5,2)
updated_at TIMESTAMPTZ

-- dashboard_kpis
metric_name TEXT UNIQUE           -- "avg_lithium_price", "total_suppliers", etc.
metric_value DECIMAL(15,2)
previous_value DECIMAL(15,2)
change_percent DECIMAL(6,2)

-- market_news
title TEXT, summary TEXT
source TEXT, url TEXT
sentiment TEXT                    -- "positive", "negative", "neutral"
sentiment_score DECIMAL(5,2)
category TEXT

-- arbitrage_opportunities
buy_region TEXT, sell_region TEXT
buy_price DECIMAL, sell_price DECIMAL
profit_margin_percent DECIMAL(6,2)
status TEXT                       -- "active", "expired", "executed"
expires_at TIMESTAMPTZ
```

### Make.com Integration

The Make.com scenarios are already configured:

| Scenario ID | Function | Schedule |
|-------------|----------|----------|
| 4047120 | Data Store Sync | Every 5 min |
| 4042205 | KPI Updates | Webhook-triggered |
| 4042216 | Daily Briefing | Daily 16:00 UTC |

**Webhook URL** (to configure in Make.com after deployment):
```
https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook
```

### Realtime Subscriptions

The hook subscribes to Postgres changes on all market tables:

```typescript
supabase
  .channel('prices-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'market_prices'
  }, () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'prices'] });
  })
  .subscribe();
```

---

## Files Changed Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/hooks/useMarketData.ts` | Market data hook with Realtime |
| CREATE | `supabase/functions/make-webhook/index.ts` | Webhook handler for Make.com |
| MODIFY | `supabase/config.toml` | Add `make-webhook` function config |
| MODIFY | `src/pages/Dashboard.tsx` | Integrate market data components |
| MIGRATE | (SQL) | Create 5 tables + RLS + seed data |

---

## Testing Plan

After implementation:
1. Verify seed data appears in dashboard via `SELECT * FROM dashboard_kpis`
2. Test webhook with curl:
   ```bash
   curl -X POST https://vuekwckknfjivjighhfd.supabase.co/functions/v1/make-webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"kpi_update","data":{"metric_name":"test","value":999}}'
   ```
3. Verify Realtime updates propagate to UI without refresh
4. Update Make.com scenario 4047120 with the new webhook URL

---

## Dependencies

- **External**: Make.com team ID 1841512 (already configured)
- **External**: Perplexity API (already integrated in Make.com)
- **Internal**: TanStack React Query (already installed)
- **Internal**: Supabase Realtime (already enabled)

## Success Criteria

- Dashboard displays live market prices from Supabase
- KPIs update in real-time when Make.com pushes new data
- News feed shows sentiment-analyzed articles
- Arbitrage opportunities display with profit margins
- No page refresh required for updates (Realtime working)
