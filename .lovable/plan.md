

# Full Production Readiness Implementation Plan

## Overview
The merge from the external branch did not propagate any changes into the Lovable environment. This plan re-implements all missing features directly in Lovable, fixes existing bugs, connects live data pipelines, and gates features by subscription tier.

---

## Phase 1: Critical Bug Fixes (Immediate)

### 1.1 Fix `useRealtimeSubscriptions` Rules-of-Hooks Violation
- **File:** `src/hooks/useRealtimeSubscription.ts`
- **Problem:** `useRealtimeSubscriptions` calls `useRealtimeSubscription` inside `.forEach()`, violating React's Rules of Hooks
- **Fix:** Remove the `useRealtimeSubscriptions` function entirely (it's not imported anywhere) or replace with a single `useEffect` that manages multiple channels without calling hooks in a loop

### 1.2 Fix Airtable Formula Injection
- **File:** `src/services/airtable.service.ts`
- **Problem:** User inputs are string-interpolated directly into Airtable filter formulas (`{Category} = '${options.category}'`)
- **Fix:** Add an `escapeAirtableValue()` helper that escapes single quotes and special characters before interpolation

### 1.3 Fix Landing Page Hero Image
- **File:** `src/pages/Landing.tsx` (line 23)
- **Problem:** `const lithiumHeroImg = '/logo.png';` ignores the actual crystal hero image
- **Fix:** Use `new URL('@/assets/landing/lithium-crystal-hero.png', import.meta.url).href`

### 1.4 Remove "Phase 2: Real-time Bidding" TODO Stub
- **File:** `src/pages/Auctions.tsx` (lines 126-135)
- **Problem:** Customer-visible TODO stub saying "this isn't done yet"
- **Fix:** Remove the entire dashed-border stub section

---

## Phase 2: Auction Detail Page (Core Feature)

### 2.1 Create `src/pages/AuctionDetail.tsx`
A full auction bidding page with:
- Live countdown timer (using `useEffect` + `setInterval`)
- Bid form with amount input and reserve price indicator
- Bid history table showing all bids (descending by amount)
- Auction metadata (title, description, currency, reserve, start/end dates)
- Anti-sniping notice for live auctions
- Loading/error/empty states per Rule 8
- Subscription gating: Free users see read-only view, Pro/Enterprise can bid

### 2.2 Update Routing in `src/App.tsx`
- Change `/auctions/:id` route from `<Auctions />` to `<AuctionDetail />`
- Add lazy loading for the new page

### 2.3 Update Auction Cards to Link to Detail
- **File:** `src/pages/Auctions.tsx`
- Make scheduled/ended auction cards link to `/auctions/:id` (currently only live cards link)

---

## Phase 3: Airtable CRUD Edge Function + Service

### 3.1 Add `AIRTABLE_BASE_ID` Secret
- The `airtable-proxy` edge function already reads this env var but it's not in the secrets list

### 3.2 Create `supabase/functions/airtable-crud/index.ts`
Full CRUD edge function supporting:
- **GET:** Read records from any configured Airtable table
- **POST:** Create records (syncs to Supabase)
- **PATCH:** Update records
- **DELETE:** Delete records
- Subscription gating: Free = read-only, Pro = full CRUD, Enterprise = batch operations
- Input sanitization for formula injection prevention
- Tables: `Market_Intelligence`, `Auction_Companies`, `Auction_Contacts`, `FAQs`, `Products`

### 3.3 Create `src/services/airtable-crud.service.ts`
Client-side service wrapping the edge function with:
- Type-safe CRUD methods per table
- Subscription tier checks before write operations
- React Query integration helpers

### 3.4 Update `supabase/config.toml`
Add `[functions.airtable-crud]` with `verify_jwt = false`

---

## Phase 4: Perplexity Market Intelligence

### 4.1 Create `supabase/functions/perplexity-market-intel/index.ts`
Edge function that:
- Calls Perplexity API for live lithium market data
- Supports query categories: `price`, `supply`, `demand`, `regulatory`, `technology`
- Caches results in `market_news` Supabase table
- Subscription gating: Free = 3 price queries/day, Pro = unlimited all categories, Enterprise = raw API response
- Uses existing `PERPLEXITY_API_KEY` secret

### 4.2 Create `src/services/market-intel.service.ts`
Service layer calling the edge function with category and query params

### 4.3 Create `src/hooks/useMarketIntel.ts`
React Query hook with:
- Automatic polling (configurable interval)
- Category-based query keys
- Stale time appropriate to tier

### 4.4 Update `supabase/config.toml`
Add `[functions.perplexity-market-intel]` with `verify_jwt = false`

---

## Phase 5: Verification Badge + Verification Page

### 5.1 Add `lithiumbuy` Tier to VerificationBadge
- **File:** `src/components/shared/VerificationBadge.tsx`
- Add a `lithiumbuy` tier with `BadgeCheck` icon, branded blue color scheme, label "LITHIUMBUY STANDARD"

### 5.2 Connect Verification Page to Database
- **File:** `src/pages/Verification.tsx`
- Replace `mockVerifications` array with React Query hook fetching from `verification_requests` table (or equivalent)
- If the table doesn't exist, show a proper `EmptyState` component instead of mock data

---

## Phase 6: Integration Wiring and Route Verification

### 6.1 Verify All 28+ Routes
Confirm every route in `src/App.tsx` resolves to a real page component with proper:
- Auth guards (ProtectedRoute)
- Subscription gates (RoleProtectedRoute)
- Loading/error states

### 6.2 Connect Dashboard Market Components
Ensure `LivePriceTicker`, `MarketNewsFeed`, `ArbitragePanel` in `src/components/market/` use the new Perplexity market intel hook for live data instead of fallback/empty states

---

## Technical Details

### Files to Create (6)
1. `src/pages/AuctionDetail.tsx` -- Auction bidding page
2. `supabase/functions/airtable-crud/index.ts` -- CRUD edge function
3. `supabase/functions/perplexity-market-intel/index.ts` -- Market intel edge function
4. `src/services/airtable-crud.service.ts` -- Airtable CRUD client service
5. `src/services/market-intel.service.ts` -- Perplexity market intel service
6. `src/hooks/useMarketIntel.ts` -- Market intel React Query hook

### Files to Modify (8)
1. `src/hooks/useRealtimeSubscription.ts` -- Remove hooks-in-loop violation
2. `src/services/airtable.service.ts` -- Fix formula injection
3. `src/pages/Landing.tsx` -- Fix hero image
4. `src/pages/Auctions.tsx` -- Remove TODO stub, link all cards to detail
5. `src/App.tsx` -- Route `/auctions/:id` to AuctionDetail
6. `src/components/shared/VerificationBadge.tsx` -- Add lithiumbuy tier
7. `src/pages/Verification.tsx` -- Remove mock data, connect to DB
8. `supabase/config.toml` -- Add new edge function configs

### Secrets to Add (1)
- `AIRTABLE_BASE_ID` -- Required by existing `airtable-proxy` and new `airtable-crud`

### Dependencies
- No new npm packages required
- All features use existing shadcn/ui components, React Query, and Supabase client

### Execution Order
1. Bug fixes first (Phase 1) -- they're independent and quick
2. AuctionDetail page (Phase 2) -- uses existing hooks/services
3. Edge functions (Phases 3-4) -- can be done in parallel
4. Badge + Verification (Phase 5) -- UI only
5. Integration wiring (Phase 6) -- final verification pass

