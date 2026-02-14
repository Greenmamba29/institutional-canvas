
# Admin Panel: Users, Suppliers, Audit Log + Airtable API Key Management

## Overview

Build a dedicated `/admin` route (accessible only to `super_admins` table members) with tabbed panels for user management, supplier oversight, audit log viewing, and Airtable API key configuration. The admin nav item is only visible in the sidebar when the logged-in user exists in `super_admins`.

---

## Architecture

### Admin Access Gate (Hard Rule)

Admin access is validated server-side via the `super_admins` table -- not from `profiles.is_admin` or client-side storage. A new hook `useIsSuperAdmin` will query:

```text
SELECT 1 FROM super_admins WHERE user_id = auth.uid()
```

The sidebar "Admin" nav item renders ONLY when this query returns true. The `/admin` route is wrapped in `RoleProtectedRoute` with `allowedOrgTypes={['admin']}` as a first gate, plus the `super_admins` check inside the page itself as a second hard gate.

---

## New Files

### 1. `src/hooks/useIsSuperAdmin.ts`
- React Query hook that checks `super_admins` table for current user
- Returns `{ isSuperAdmin: boolean, isLoading: boolean }`
- Cached for 10 minutes (stable, rarely changes)

### 2. `src/pages/Admin.tsx`
- Main admin page with 4 tabs:
  - **Users** -- lists `profiles` table (id, email, full_name, tier, created_at)
  - **Suppliers** -- lists `suppliers` or `supplier_profiles` table
  - **Audit Log** -- reads `domain_events` table (entity_type, event_type, actor, timestamp, payload preview)
  - **Settings** -- Airtable API key input field that calls an RPC or edge function to update the secret

### 3. `src/components/admin/UsersPanel.tsx`
- DataTable of all users from `profiles`
- Columns: Name, Email, Tier, Created, Org
- Read-only (no direct mutations per protocol)

### 4. `src/components/admin/SuppliersPanel.tsx`
- DataTable of suppliers from `supplier_profiles` or `suppliers`
- Columns: Name, Status, Verification, Location
- Read-only view

### 5. `src/components/admin/AuditLogPanel.tsx`
- DataTable reading from `domain_events`
- Columns: Timestamp, Actor, Entity Type, Event Type, Payload (truncated)
- Sorted newest-first, paginated (limit 50)

### 6. `src/components/admin/AdminSettingsPanel.tsx`
- Airtable API Key input with masked display
- Save button calls an edge function to securely store the key
- Shows current connection status (tests the key via airtable-proxy)

---

## Modified Files

### `src/App.tsx`
- Add `/admin` route inside `ProtectedRoute`, wrapped with `RoleProtectedRoute allowedOrgTypes={['admin']}`

### `src/components/layout/LayoutShell.tsx`
- Add "Admin" nav item (Shield icon) to `adminNavItems` array
- Conditionally render it only when `useIsSuperAdmin()` returns true
- Position: after Analytics, before Settings section

---

## Database

No schema changes needed. All required tables exist:
- `super_admins` (user_id, granted_at, granted_by, note)
- `profiles` (id, email, full_name, tier, created_at, org_id)
- `suppliers` / `supplier_profiles` (supplier data)
- `domain_events` (id, org_id, actor_user_id, entity_type, entity_id, event_type, payload, created_at)

---

## Security Enforcement

1. Sidebar "Admin" link only renders if `super_admins` contains current user (server query)
2. `/admin` route uses `RoleProtectedRoute` with `allowedOrgTypes={['admin']}`
3. Inside Admin page, a secondary `super_admins` check prevents access even if URL is typed directly
4. All data is read-only -- no direct table mutations
5. Airtable key update goes through a secure edge function (not client-side)

---

## Technical Details

```text
File Changes Summary:
-----------------------------------------------------
NEW   src/hooks/useIsSuperAdmin.ts        (~25 lines)
NEW   src/pages/Admin.tsx                  (~80 lines)
NEW   src/components/admin/UsersPanel.tsx  (~70 lines)
NEW   src/components/admin/SuppliersPanel.tsx (~70 lines)
NEW   src/components/admin/AuditLogPanel.tsx  (~80 lines)
NEW   src/components/admin/AdminSettingsPanel.tsx (~60 lines)
EDIT  src/App.tsx                          (+3 lines)
EDIT  src/components/layout/LayoutShell.tsx (+8 lines)
-----------------------------------------------------
Total: 6 new files, 2 edited files
```
