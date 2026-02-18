
# Sitewide Performance Refactor + Mobile Sidebar Sign-Out Fix

## Root Cause Analysis

### Performance: 6.5 Second Page Load

The performance profile reveals two hard problems:

**Problem 1 — No code splitting (biggest impact)**
`App.tsx` imports every page as a static top-level import (20+ pages). This forces the browser to load, parse, and compile every page's JavaScript bundle before rendering anything. Result: 249 script chunks, 1.7MB total JS, 6.5s DOM Content Loaded. `lucide-react` alone takes 1474ms to parse.

**Problem 2 — LayoutShell fires 7+ expensive hooks on every page render**
Every page that renders `LayoutShell` triggers all of these simultaneously:
- `useSidebarCounts` → 5 parallel Supabase queries + 5 realtime channel subscriptions
- `useIsSuperAdmin` → 1 Supabase query
- `GMVSummaryPanelConnected` → `useGMVStats` + `useGMVSparkline` (data fetching)
- `RoleContext` (already running) → `get_user_org_role` RPC
- `NotificationContext` (already running) → notifications query

This means navigating from `/dashboard` to `/messages` causes all 7 of these hooks to fire/re-evaluate because `LayoutShell` remounts on every page transition (it's declared inside each page component, not in the router).

**Problem 3 — LayoutShell is re-instantiated per page**
Because every page file wraps its own content in `<LayoutShell>`, the sidebar itself unmounts and remounts on every navigation. This is why page transitions feel slow — the sidebar re-renders from scratch each time.

### Mobile Sidebar: Missing Sign Out

The screenshot shows the mobile sidebar nav list goes straight to nav items with no visible Sign Out or Settings at the bottom. The issue is the mobile sidebar's `<nav>` section has `overflow-y-auto` but the `<div className="p-3 border-t border-border/50 space-y-2">` bottom section containing Settings, Billing, and Sign Out is outside the scrollable area but the sidebar itself has no `flex flex-col` structure to pin it to the bottom. On shorter screens the nav items push the bottom section off-screen with no way to scroll to it.

---

## Fix 1: Mobile Sidebar Layout (Immediate Bug Fix)

**File: `src/components/layout/LayoutShell.tsx`**

The mobile `<aside>` needs a proper flex column structure so the bottom section always stays pinned and visible:

```
aside (fixed, flex flex-col)
  ├── header (flex-shrink-0)
  ├── nav (flex-1, overflow-y-auto)     ← scrolls
  └── bottom-section (flex-shrink-0)   ← always pinned at bottom
```

Currently the mobile sidebar is missing `flex flex-col` on the `<aside>` and `flex-shrink-0` on the bottom div, so it collapses behind the nav overflow.

Additionally, the Sign Out button text ("Sign Out") in the desktop collapsed sidebar (when `sidebarOpen = false`) is already hidden. The mobile sidebar always shows text — that's correct — but the layout fix above is what ensures it's reachable.

---

## Fix 2: Code Splitting via React.lazy (Biggest Performance Win)

**File: `src/App.tsx`**

Convert all page imports from static to lazy:

```typescript
// BEFORE (causes 6.5s load)
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
// ... 18 more

// AFTER (each page loads only when navigated to)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
// ... 18 more
```

Wrap the `<Routes>` in a `<Suspense>` with a lightweight fallback skeleton. This alone should drop initial load from ~6.5s to ~1.5-2s because:
- `lucide-react` only loads once per actual page visit rather than being pulled in for all 20 pages upfront
- `recharts` (222KB) only loads when a chart page is visited
- The auth page loads without pulling in Dashboard, TeleBuy, AIStudio, etc.

---

## Fix 3: Lift LayoutShell Out of Individual Pages (Persistent Layout)

**This is the architectural change that fixes page transition speed.**

Currently:
```
/dashboard → <Dashboard> → <LayoutShell> → content
/messages  → <Messages>  → <LayoutShell> → content  ← sidebar remounts
```

After refactor (React Router nested layout pattern):
```
/dashboard → <AppLayout> (LayoutShell, mounted once) → <Dashboard>
/messages  → <AppLayout> (same instance, no remount) → <Messages>
```

**Implementation:**

1. Create `src/components/layout/AppLayout.tsx` — a thin wrapper that renders `LayoutShell` once with `<Outlet />` for the page content
2. In `App.tsx`, nest all protected routes under a single `<Route element={<AppLayout />}>` parent
3. Remove `<LayoutShell>` from every individual page component — they become pure content components

This means the sidebar, its 5 realtime subscriptions, the GMV panel, and the user dropdown are instantiated ONCE for the entire authenticated session, not once per page. Page transitions become instant React re-renders of just the main content area.

**Pages that need `<LayoutShell>` removed** (content-only after refactor):
Dashboard, Marketplace, RFQs, Bids, Auctions, AuctionDetail, Analytics, Settings, Verification, Messages, Deals, TeleBuy, AIStudio, Data, Orders, Billing, Purchases, Team, ChainOfCustody, Admin, Recycling, KYCCompliance, CompanyVerification, APIIntegration

---

## Fix 4: Optimize useSidebarCounts

**File: `src/hooks/useSidebarCounts.ts`**

Increase `staleTime` from 30s to 2 minutes and add `gcTime` (garbage collection) of 5 minutes. This prevents the 5 parallel count queries from re-firing on every page focus event. The realtime subscriptions already handle live updates — the polling interval is redundant:

```typescript
staleTime: 2 * 60 * 1000,    // 2 minutes (was 30s)
gcTime: 5 * 60 * 1000,        // 5 minutes
refetchOnWindowFocus: false,  // realtime handles updates
```

---

## Fix 5: Settings Page Cleanup

**File: `src/pages/Settings.tsx`**

The Settings page currently still has the old `actionSections` structure from the previous state (pre-implementation). Now that KYC, API Integration, and Company Verification are real routes, the Settings page should be a clean navigation hub with all 7 settings destinations clearly listed. Remove any "Coming Soon" references or dead-end links (`href: "/settings"` for Security/Notifications). Each card should go to a real, specific route or clearly indicate it's a future feature.

Add a dedicated "Sign Out" action button directly on the Settings page for discoverability.

---

## Implementation Order

| # | File | Change | Impact |
|---|------|--------|--------|
| 1 | `src/components/layout/LayoutShell.tsx` | Fix mobile sidebar flex structure so bottom section (Settings, Billing, Sign Out) is always pinned | Bug fix — immediate |
| 2 | `src/App.tsx` | Add `React.lazy()` + `Suspense` for all 20+ page imports | ~4s faster initial load |
| 3 | `src/components/layout/AppLayout.tsx` | Create persistent layout component using `<Outlet />` | New file |
| 4 | `src/App.tsx` | Nest protected routes under `<AppLayout>` as persistent layout | Instant page transitions |
| 5 | All 24 page files | Remove `<LayoutShell>` wrapper, return content directly | Required for Fix 4 |
| 6 | `src/hooks/useSidebarCounts.ts` | Increase staleTime, disable window focus refetch | Fewer redundant DB calls |
| 7 | `src/pages/Settings.tsx` | Clean up links, add Sign Out button | UX improvement |

---

## Technical Notes

- Lazy loading requires `import React, { lazy, Suspense } from 'react'` in `App.tsx`
- The `<Suspense fallback={<LoadingScreen />}>` wrapper goes around `<Routes>` inside `AppContent`
- `AppLayout.tsx` should NOT be lazy-loaded — it's the persistent shell
- Onboarding (`/onboarding`) and other routes that don't use `LayoutShell` stay as-is
- The `ProtectedRoute` (auth guard) stays at the router level, above `AppLayout`
- The `RoleProtectedRoute` (subscription guard) stays nested where it is
- Pages become pure content — they receive no props, just render their content using hooks directly
- This pattern is standard React Router v6 "layout routes" and is what the framework recommends for persistent navigation

---

## Expected Outcomes After Implementation

| Metric | Before | After (estimated) |
|--------|--------|-------------------|
| DOM Content Loaded | 6.5s | ~1.5s |
| Page-to-page transition | Full remount (~300ms) | Instant (~16ms) |
| DB queries per navigation | 5-7 per page | 0 (cached, realtime handles updates) |
| Mobile Sign Out visibility | Broken (off-screen) | Always visible, pinned to bottom |
| Settings Sign Out access | Top-right dropdown only | Sidebar + Settings page |
