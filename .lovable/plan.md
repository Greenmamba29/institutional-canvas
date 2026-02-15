

# Re-apply All MVP Fixes to Claude Branch

## Status: Nothing from Lovable synced to this branch

All previous changes need to be rebuilt. Here is the complete list:

---

## Part 1: Database Migration (RLS + RPC Fixes)

Apply a single SQL migration to fix data visibility across 5+ pages:

- **Add fallback SELECT policies** for `bids`, `deals`, `auctions`, `auction_bids` using `org_members` lookup instead of `jwt_org_id()`
- **Replace `list_rfqs` RPC** to filter by `org_members` instead of JWT claims
- **Drop conflicting TeleBuy RLS policies** (`telebuy_select_org`, `telebuy_update_org`, `telebuy_delete_org`)

This fixes: RFQs page empty, Bids page empty, Deals page empty, TeleBuy "Failed to load sessions"

---

## Part 2: Frontend Resilience Fixes (4 files)

| File | Change | Why |
|------|--------|-----|
| `src/hooks/useAuctions.ts` | Remove `enabled: !!currentOrgId` (line 28) | Auctions are marketplace-wide, should load for all authenticated users |
| `src/services/rfqs.service.ts` | Change `.single()` to `.maybeSingle()` (line 37) | Prevents crash when RFQ not found |
| `src/services/auctions.service.ts` | Change `.single()` to `.maybeSingle()` (line 29) | Prevents crash when auction not found |
| `src/pages/Messages.tsx` | Add `px-1` to header div (line 111) | Fix mobile header clipping |

---

## Part 3: Admin Panel (6 new files + 2 edits)

### New files:
1. `src/hooks/useIsSuperAdmin.ts` -- React Query hook checking `super_admins` table
2. `src/pages/Admin.tsx` -- Tabbed admin page (Users, Suppliers, Audit Log, Settings)
3. `src/components/admin/UsersPanel.tsx` -- DataTable of `profiles`
4. `src/components/admin/SuppliersPanel.tsx` -- DataTable of `suppliers`
5. `src/components/admin/AuditLogPanel.tsx` -- DataTable of `domain_events`
6. `src/components/admin/AdminSettingsPanel.tsx` -- Airtable API key management

### Edited files:
- `src/App.tsx` -- Add `/admin` route inside ProtectedRoute
- `src/components/layout/LayoutShell.tsx` -- Add conditional "Admin" nav item using `useIsSuperAdmin()`

---

## Implementation Order

1. Database migration first (unblocks all data pages)
2. Frontend resilience fixes (4 small edits)
3. Admin panel (new feature, independent of above)

## Expected Outcome

- All core pages (RFQs, Bids, Deals, Auctions, TeleBuy, Messages) load without errors
- Pages show empty states gracefully when no data exists
- Admin panel accessible only to `super_admins` table members
- Airtable API key manageable from Admin Settings

