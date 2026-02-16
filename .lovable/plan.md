
# Fix Sidebar Navigation, Auth Controls, and Subscription Gating

## Problems Identified

1. **Mobile sidebar missing gating indicators** -- The mobile hamburger menu renders all nav items without PRO badges or lock icons, unlike the desktop sidebar which shows them.
2. **Route-level gating is incomplete** -- Only `/ai-studio` is wrapped with `RoleProtectedRoute`. The `/telebuy` route (marked `requiresTier: 'pro'` in the sidebar) has NO route guard, so users can navigate directly to it regardless of subscription.
3. **Mobile sidebar missing user profile section** -- The desktop sidebar header shows user name, tier, and org type, but the mobile sidebar does not.
4. **Sidebar gating logic inconsistency** -- Items marked with `requiresTier` show a "PRO" badge on desktop but still navigate freely; they should either block navigation or redirect to the paywall.

## Plan

### Step 1: Fix Mobile Sidebar Gating (LayoutShell.tsx)
Add the same tier-gating logic from the desktop nav (lines 221-224) to the mobile nav section (lines 338-357):
- Show PRO/Enterprise badges on locked items
- Apply opacity styling for locked items
- Add user profile card at the bottom of mobile sidebar (name, tier, org type)

### Step 2: Add Missing Route Guards (App.tsx)
Wrap subscription-gated routes with `RoleProtectedRoute`:
- `/telebuy` -- requires `pro` subscription
- `/data` -- remains ungated (no `requiresTier` in nav config)

### Step 3: Ensure Sign Out and Settings Always Visible
Verify both mobile and desktop sidebars consistently show:
- Settings link
- Billing link  
- Sign Out button with destructive hover

These already exist in the current code for both mobile and desktop, but will be verified as part of the changes.

---

## Technical Details

### File: `src/components/layout/LayoutShell.tsx`
- **Mobile nav section (~line 339)**: Mirror desktop gating logic -- compute `isLocked` per item, render `Badge` for PRO, apply `opacity-60` class
- **Mobile user profile**: Add a small user info block above Sign Out showing `userDisplayName` and `subscriptionTier`

### File: `src/App.tsx`
- Wrap `/telebuy` route:
```text
<Route element={<RoleProtectedRoute requireSubscription="pro" />}>
  <Route path="/telebuy" element={<TeleBuy />} />
  <Route path="/telebuy/session/:id" element={<TeleBuy />} />
</Route>
```

### Gating Rules Summary
| Route | Required Tier | Current Guard | Fix |
|-------|--------------|---------------|-----|
| /ai-studio | Pro | RoleProtectedRoute | None needed |
| /telebuy | Pro | None | Add RoleProtectedRoute |
| /marketplace | Org type check | Sidebar filter only | Already filtered |
| /admin | Super admin | Sidebar filter + page check | Already guarded |
| /verification | Admin only | Sidebar filter | Already filtered |
