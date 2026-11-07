# LithiumBuy MVP — Phases 5–7 Master (What’s Actually Left)

**Last verified against GitHub `origin/main`:** 2026-01-19  
**Repo health:** ✅ `npm run build` passes • ✅ `npx tsc --noEmit` passes

---

## Why you’re seeing “64 pending”

- The “pending” count is coming from **legacy checklist docs** that were never updated after the code moved forward.
- Example: `MVP_COMPLETE_PLAN.md` alone currently contains **63 unchecked** checklist items (`[ ]`), despite many being implemented in code.
- Treat those legacy docs as **historical context**, not the source of truth for execution.

**This file is the new execution source of truth for finishing Phases 5–7.**

---

## Phase 5 — Multi-tenant + Realtime + Replace remaining mock data

### ✅ Already done (verified in code)
- **Notifications are backend-driven + realtime**: `src/context/NotificationContext.tsx`
- **Realtime foundation exists and is used**: `src/hooks/useRealtimeSubscription.ts` and usage across hooks

### ⏳ Remaining (to complete Phase 5)
- [ ] **Dashboard: remove remaining hardcoded “demo” arrays**
  - **File:** `src/pages/Dashboard.tsx`
  - **Current state:** contains hardcoded arrays (e.g. audit entries, partners, upcoming auctions)
  - **Goal:** either replace with real hooks/data OR move to clearly labeled “demo” fixtures behind a feature flag.
- [ ] **Audit remaining mock sources**
  - **Primary suspects:** `src/data/mockData.ts` and any pages/components still rendering static “pending settlements/logistics” cards as if real.
  - **Goal:** eliminate or clearly label as demo; MVP requires *real* backend-driven data for core flows.
- [ ] **Confirm realtime coverage for core business tables**
  - **Must be realtime-invalidated:** RFQs, Bids, Deals, Purchases, Notifications (already), Auctions
  - **Acceptance:** create in one tab → visible in another without refresh.

---

## Phase 6 — Action forms fully wired (end-to-end)

### ✅ Components exist (verified)
- `src/components/rfq/CreateRFQDialog.tsx` ✅
- `src/components/bid/SubmitBidForm.tsx` ✅
- `src/components/bid/AwardDealButton.tsx` ✅
- `src/components/deal/DealResponseButtons.tsx` ✅

### ✅ Partially wired (verified)
- **RFQs:** `src/pages/RFQs.tsx` renders `<CreateRFQDialog />`
- **Bids:** `src/pages/Bids.tsx` renders `<AwardDealButton />`

### ⏳ Remaining (to complete Phase 6)
- [ ] **Wire supplier bid submission into the RFQ detail UX**
  - **Expected:** supplier can open an RFQ and submit a bid (using `SubmitBidForm`)
  - **Where:** likely `src/pages/RFQs.tsx` (needs a detail panel/route handling if not present)
- [ ] **Wire supplier accept/reject into deal workflow**
  - **Expected:** supplier can accept/reject a pending deal (using `DealResponseButtons`)
  - **Where:** `src/pages/Deals.tsx` currently lists cards only; needs deal detail route/modal wiring.
- [ ] **End-to-end: RFQ → Bid → Award → Accept/Reject → Purchase**
  - **Acceptance:** every button triggers the correct RPC and shows toast success/error.

---

## Phase 7 — PWA + Cleanup + “ship checks”

### ✅ Already done (verified)
- **Build passes:** `npm run build`
- **Typecheck passes:** `npx tsc --noEmit`
- **Manifest exists:** `public/manifest.json`

### ⏳ Remaining (to complete Phase 7)
- [ ] **PWA meta tags + icons sanity check**
  - Confirm `index.html` links manifest + icons exist in `public/`
- [ ] **Security regression: no secrets in frontend**
  - **Do NOT hardcode** Supabase anon keys or any API keys in `src/integrations/supabase/client.ts`.
  - If keys were added locally, revert before committing.
- [ ] **Run “ship checklist” and record results**
  - **Doc:** `MVP_SHIP_CHECKLIST.md`

---

## “Gemini Integration” — current state and what remains

### Current state (verified)
- AI Studio includes new components/services, but core forecasting/matching/risk logic is **still mock/demo** in services:
  - `src/services/ai/price-forecast.service.ts`
  - `src/services/ai/risk-assessment.service.ts`
  - `src/services/ai/supplier-matcher.service.ts`

### MVP goal for Gemini
- [ ] Replace demo AI services with **Gemini-backed** inference via a backend boundary:
  - **Preferred:** Supabase Edge Function(s) (keeps keys off client)
  - **Minimum:** one real Gemini call path for at least **one** AI Studio tab with clear rate limiting + error handling

---

## 5-agent finish plan (synchronized)

### Agent A — Phase 6 wiring (RFQ bid + deal response)
- Implement RFQ detail flow with `SubmitBidForm`
- Implement deal detail flow with `DealResponseButtons`
- Validate role gating (supplier vs buyer/admin)

### Agent B — Phase 5 mock purge + dashboard realism
- Remove/flag demo arrays on Dashboard
- Ensure KPIs are derived from real hooks
- Confirm realtime invalidation patterns

### Agent C — Payments + subscription gating verification
- Validate upgrade button → checkout → webhook → subscription tier update → UI unlock
- Confirm Admin bypass behavior is correct and consistent

### Agent D — Airtable sync verification + observability
- Validate `sync-to-airtable` function behavior
- Ensure events write to audit/log table (e.g. `webhook_events`) and failures are visible

### Agent E — QA / execution runner (the “truth agent”)
- Run the full workflow in browser (Buyer + Supplier + Admin + SOE)
- Record results + screenshots/notes
- Gate: build/typecheck pass, no critical console errors, flows succeed

---

## Acceptance gates (MVP is “done” only if all pass)

- [ ] **Build:** `npm run build` ✅
- [ ] **Typecheck:** `npx tsc --noEmit` ✅
- [ ] **Auth:** signup/login/reset works
- [ ] **Org:** create org + switch org works
- [ ] **RFQ:** create RFQ works
- [ ] **Bid:** supplier submits bid works
- [ ] **Award:** buyer awards bid → deal created
- [ ] **Respond:** supplier accept/reject works
- [ ] **Purchases:** PO creation/visibility works (if included in flow)
- [ ] **Realtime:** changes reflect without refresh (at least RFQs + notifications)
- [ ] **No secrets in client code**

