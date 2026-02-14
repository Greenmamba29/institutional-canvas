

# Merge Sync + Phase 5 & 6 Completion

## Build Error Fixes (Immediate)

Two TypeScript errors in edge functions where `error` is typed as `unknown` but `.message` is accessed directly.

### Fix 1: `supabase/functions/airtable-crud/index.ts` (line 101)
Change `error.message` to `error instanceof Error ? error.message : String(error)`

### Fix 2: `supabase/functions/perplexity-market-intel/index.ts` (line 100)
Same fix -- `error instanceof Error ? error.message : String(error)`

---

## Phase 5: Verification Badge + Page (Already Done)

Both items from the original plan are already implemented in the current codebase:
- The `lithiumbuy` tier exists in `VerificationBadge.tsx` with BadgeCheck icon and branded accent color
- `Verification.tsx` queries the `kyb_verification_queue` table via React Query with proper loading/error/empty states

No further work needed for Phase 5.

---

## Phase 6: Integration Wiring & Route Verification

### 6.1 Route Audit (Already Complete)
All 28+ routes in `App.tsx` are correctly wired:
- Public: `/`, `/auth`, `/auth/callback`, `/password-reset`
- Protected: `/dashboard`, `/marketplace`, `/rfqs`, `/bids`, `/auctions`, `/auctions/:id` (AuctionDetail), `/deals`, `/orders`, `/purchases`, `/telebuy`, `/chain-of-custody`, `/data`, `/analytics`, `/settings`, `/verification`, `/messages`, `/team`
- Subscription-gated: `/ai-studio` requires Pro via `RoleProtectedRoute`
- `/onboarding` is inside ProtectedRoute but explicitly allowed without organization

### 6.2 Dashboard Market Components (Already Connected)
The Dashboard already imports and renders all three market components:
- `LivePriceTicker` -- uses `usePrices()` from `useMarketData` hook (Supabase Realtime on `market_prices`)
- `MarketNewsFeed` -- uses `useNews()` from `useMarketData` hook (Supabase Realtime on `market_news`)
- `ArbitragePanel` -- uses `useArbitrage()` from `useMarketData` hook (Supabase Realtime on `arbitrage_opportunities`)

These are wired to live Supabase tables with real-time subscriptions. The Perplexity edge function populates data into these same tables, so the pipeline is: **Perplexity API -> Edge Function -> market_news table -> Supabase Realtime -> Dashboard components**.

### 6.3 Market Intel Hook (Available but Not Yet Surfaced)
The `useMarketIntel` hook exists and is subscription-gated (free: price only, pro: all categories). It calls the `perplexity-market-intel` edge function directly. This hook can be used in AI Studio or other Pro-tier pages for on-demand intelligence queries. No immediate wiring needed -- it's ready when those pages need it.

---

## Summary of Changes

Only **2 lines** need to change across **2 files** to fix the build errors. Everything else from Phase 5 and Phase 6 is already implemented and connected.

### Technical Details

| File | Line | Change |
|------|------|--------|
| `supabase/functions/airtable-crud/index.ts` | 101 | `error.message` -> `error instanceof Error ? error.message : String(error)` |
| `supabase/functions/perplexity-market-intel/index.ts` | 100 | `error.message` -> `error instanceof Error ? error.message : String(error)` |

### Post-Fix Verification
After the two-line fix, I will:
1. Confirm the build passes cleanly
2. Test both edge functions via curl to verify they respond correctly
3. Navigate through the app to verify routing and component rendering
4. Deliver a full roast of remaining issues

