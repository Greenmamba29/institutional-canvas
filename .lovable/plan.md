

# 3-Phase Implementation: Build Error Fix, Recycling Page, and Uploaded File Changes

## Summary

The uploaded `LOVABLE_PASTE_ALL_CHANGES.md` contains updated versions of 12 files from a separate repo. Most are already identical or nearly identical to what exists in the current branch. The key gaps are:

1. **Build error**: `update_telebuy_session_status` RPC does not exist in the generated types
2. **Recycling page**: `/recycling` is in the sidebar nav but has NO route or page component -- it hits the 404 catch-all
3. **Admin data gating**: Admin panels already exist and work, but no explicit role-based hiding of sensitive columns in query results
4. **Minor file updates** from the uploaded `.md` that differ from current code

---

## Phase 1: Fix Build Error and Data Linking

**1a. Fix telebuy.service.ts build error (TS2345)**
- The RPC `update_telebuy_session_status` is not in `types.ts` (not in the database)
- Fix: Cast the RPC call to bypass strict typing, matching the pattern used elsewhere with `(supabase as any).rpc()`
- File: `src/services/telebuy.service.ts` -- change `callRpc` to use `(supabase as any).rpc()` for this function, or add `as any` cast to the function name

**1b. Apply uploaded file diffs that differ from current code**
These files from the uploaded `.md` are already identical or functionally equivalent to current code:
- `src/lib/auth/config.ts` -- already matches
- `src/services/airtable-crud.service.ts` -- already matches
- `src/App.tsx` -- already matches
- `src/hooks/useSubscriptionTier.ts` -- needs review, may need minor update

Files that need updates:
- `src/components/shared/VerificationBadge.tsx` -- add `lithiumbuy` tier variant if missing
- `src/hooks/useRealtimeSubscription.ts` -- ensure `useRealtimeSubscriptions` removal note is present
- `src/hooks/useMarketIntel.ts` -- verify declarative query hook matches uploaded version
- `src/services/market-intel.service.ts` -- verify matches uploaded version
- `src/hooks/useAuctionParticipants.ts` -- verify matches uploaded version
- `src/services/auction-participants.service.ts` -- verify matches uploaded version

---

## Phase 2: Create Recycling Page

The sidebar has `{ label: 'Recycling', path: '/recycling', icon: Activity }` in both admin and supplier nav, but no route exists in `App.tsx` and no page component exists.

**2a. Create `src/pages/Recycling.tsx`**
- A dedicated page for battery recycling marketplace data
- Shows recycling-specific listings, black mass materials, ESG compliance filters
- Pulls data from the `listings` table filtered by recycling-related product types
- Connects to Airtable via `airtable-crud.service.ts` for supplementary recycling market data (Products table filtered by type)
- Includes loading, error, and empty states per Rule 8

**2b. Register route in `src/App.tsx`**
- Add `<Route path="/recycling" element={<Recycling />} />` inside ProtectedRoute block

---

## Phase 3: Admin Role-Based Data Gating

**3a. Hide sensitive fields in Admin panels for non-super-admin users**
- The Admin page already gates access via `useIsSuperAdmin()` -- only super admins can see it at all
- Add column-level gating: hide `email`, `user_id` columns in `UsersPanel` when not super admin (redundant since the page is already gated, but adds defense-in-depth)
- Ensure `AuditLogPanel` does not expose raw user IDs to non-super-admin contexts

**3b. Verify Admin sidebar item only shows for super admins**
- Already implemented in `LayoutShell.tsx` line 134: `if (item.path === '/admin' && !isSuperAdmin) return false`
- No changes needed here

---

## Airtable Table Requirements

For the Recycling page and sitewide data integration, these Airtable tables should exist (you mentioned you will update these yourself):

| Airtable Table | Fields Needed | Used By |
|---|---|---|
| `Products` | Name, Type (filter: 'black_mass', 'recycled_lithium', 'cathode_scrap'), Grade, Specifications, Supplier, Price_Range, Availability, Certifications, ESG_Compliant | Recycling page, Marketplace |
| `Market_Intelligence` | Query, Category, Content, Source, Timestamp | AI Studio, Data Hub |
| `Auction_Companies` | Company_Name, Company_Type, Auction_Role, Country, Verification_Tier, KYC_Status | Auctions, Recycling |
| `Auction_Contacts` | Company_ID, Contact_Full_Name, Job_Title, Lead_Status | Auctions |
| `Analytics_Events` | Event_Type, Event_Data, Timestamp, User_ID | Analytics |
| `GMV_Metrics` | Period, Total_GMV, Transaction_Count, Avg_Deal_Size | Dashboard |

---

## Technical Details

### Files to Create:
1. `src/pages/Recycling.tsx` -- Recycling marketplace page

### Files to Edit:
1. `src/services/telebuy.service.ts` -- Fix TS2345 build error (cast RPC name)
2. `src/App.tsx` -- Add `/recycling` route
3. `src/components/shared/VerificationBadge.tsx` -- Add `lithiumbuy` tier if missing
4. `src/components/admin/UsersPanel.tsx` -- Add defense-in-depth column gating
5. Up to 4 more files from uploaded `.md` if they differ after verification

### No Database Changes Required
All data comes from existing Supabase tables (`listings`, `auctions`, `super_admins`) and Airtable via edge functions.

