

# MVP Fix Plan: Resolve All Page Errors and Bring to Finished Status

## Root Cause Analysis

The screenshots show pages failing or returning empty data. After tracing through every hook, service, RLS policy, and RPC function, the issues fall into **3 systemic categories**:

---

## Category 1: `jwt_org_id()` Returns NULL (Affects 5+ Pages)

**The Problem:** Several RLS policies and RPC functions filter data using `jwt_org_id()`, which extracts `org_id` from JWT claims. Supabase Auth does not include `org_id` in its standard JWT tokens, so this function always returns NULL. Result: zero rows returned.

**Affected Pages:**
- **RFQs** -- `list_rfqs` RPC filters by `jwt_org_id()` which returns NULL, so "No RFQs found"
- **Bids** -- RLS policy `bids_select_org` uses `org_id = jwt_org_id()`, returns zero rows
- **Deals** -- RLS policy `deals_select_org` uses `org_id = jwt_org_id()`, returns zero rows
- **Auctions** -- RLS policy `auctions_select_org` uses `org_id = jwt_org_id()`, but the RPC (`list_auctions`) is SECURITY DEFINER and bypasses RLS. Shows "No auctions available" because there simply aren't any rows in the table yet.

**Fix:** Add fallback RLS policies that use `is_org_member(org_id)` (which checks `auth.uid()` against `org_members`) so data is accessible without custom JWT claims. This pattern already works for `orders`, `telebuy_sessions`, and `rfqs`.

**Database changes needed (4 new SELECT policies):**

```sql
-- Bids: allow members of the bid's org to see their bids
CREATE POLICY "bids_select_org_member" ON public.bids
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Deals: allow members of the deal's org to see their deals
CREATE POLICY "deals_select_org_member" ON public.deals
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Auctions: allow all authenticated users to view auctions (marketplace data)
CREATE POLICY "auctions_select_authenticated" ON public.auctions
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

**Fix `list_rfqs` RPC** to fall back to `org_members` lookup when `jwt_org_id()` is NULL:

```sql
CREATE OR REPLACE FUNCTION public.list_rfqs()
RETURNS SETOF rfqs LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM public.rfqs
  WHERE organization_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  )
  ORDER BY created_at DESC;
$$;
```

---

## Category 2: TeleBuy "Failed to load sessions" (Screenshot 1)

**The Problem:** The TeleBuy page shows "Failed to load sessions" because `useTelebuySessions` does a direct table read (`supabase.from('telebuy_sessions').select('*')`) which hits RLS. There are duplicate/conflicting RLS policies on `telebuy_sessions`:
- `telebuy_select_org` uses `is_org_member(org_id) OR user_id = jwt_user_id()`
- `telebuy_sessions_select_org` uses `org_id IN (SELECT get_user_org_ids())`

Both should work via `auth.uid()`, but the error suggests `jwt_user_id()` also uses JWT claims and returns NULL.

**Fix:** Simplify TeleBuy RLS policies -- drop conflicting duplicates and use a single clean policy based on `auth.uid()`:

```sql
-- Drop conflicting policies
DROP POLICY IF EXISTS "telebuy_select_org" ON telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_update_org" ON telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_delete_org" ON telebuy_sessions;

-- Keep the working org_members-based policies (telebuy_sessions_select_org, etc.)
```

Also, `telebuy.service.ts` makes direct reads that are correct. The hook `useTelebuySessions` is gated by `enabled: !!currentOrgId`, which is correct -- if the org hasn't loaded yet, the query won't fire.

---

## Category 3: Frontend Resilience Issues

### 3a. Hooks gated by `currentOrgId` show nothing until org loads
Several hooks use `enabled: !!currentOrgId`. If the org membership query fails or returns empty (new user with no org), these pages show errors instead of helpful empty states.

**Fix:** Update hooks to fall back gracefully. For pages like Auctions that should show marketplace data to all authenticated users, remove the `enabled: !!currentOrgId` gate.

**Files to edit:**
- `src/hooks/useAuctions.ts` -- Remove `enabled: !!currentOrgId` (auctions are marketplace-wide)
- `src/hooks/useTelebuy.ts` -- Keep org gate but improve error handling

### 3b. Messages page layout clip on mobile (Screenshot 3)
The "Messages" heading is clipped on the left edge on mobile.

**Fix in `src/pages/Messages.tsx`:** Add padding/margin to the header section.

### 3c. `getRfqById` uses `.single()` instead of `.maybeSingle()`
Can crash when no RFQ exists.

**Fix in `src/services/rfqs.service.ts`:** Change `.single()` to `.maybeSingle()`.

### 3d. `getAuctionById` uses `.single()` instead of `.maybeSingle()`
Same issue.

**Fix in `src/services/auctions.service.ts`:** Change `.single()` to `.maybeSingle()`.

---

## Complete File Change Summary

```text
DATABASE MIGRATIONS (SQL):
  1. Add fallback SELECT policies for bids, deals, auctions
  2. Fix list_rfqs RPC to use org_members instead of jwt_org_id()
  3. Clean up duplicate telebuy_sessions RLS policies

FRONTEND FILES:
  EDIT  src/hooks/useAuctions.ts          (~3 lines) - Remove org gate, use RPC without auth client
  EDIT  src/services/auctions.service.ts   (~5 lines) - Add unauthenticated listAuctions overload, use .maybeSingle()
  EDIT  src/services/rfqs.service.ts       (~1 line)  - Change .single() to .maybeSingle()
  EDIT  src/hooks/useTelebuy.ts            (~2 lines) - Better error message on empty org
  EDIT  src/pages/Messages.tsx             (~1 line)  - Fix mobile header clipping
```

---

## Verification After Implementation

1. **TeleBuy** -- No more "Failed to load sessions" error; shows empty state or sessions
2. **Auctions** -- Shows any auctions in DB (currently empty = shows "No auctions available" without error)
3. **RFQs** -- Shows user's org RFQs (or empty state if none created)
4. **Bids** -- Shows bids for user's org (or empty state)
5. **Deals** -- Shows deals for user's org (or empty state)
6. **Messages** -- Header no longer clipped on mobile
7. **Orders** -- Already works (uses `is_org_member()` pattern)
8. **Dashboard** -- Already works (uses SECURITY DEFINER RPCs)

## Forward Path to MVP Completion

After these fixes, the remaining work to reach MVP status:
1. Seed demo data (auctions, RFQs, bids) so pages aren't empty for demo
2. Connect Airtable API key via Admin Settings panel
3. Verify Google OAuth callback URL is allowlisted in Supabase
4. Test full user journey: Sign up -> Onboarding -> Dashboard -> Create RFQ -> Place Bid -> Award Deal -> TeleBuy session

