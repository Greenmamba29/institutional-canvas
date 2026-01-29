

# Comprehensive Fix Plan: Offline Issue + Build Errors + Continuation

## Issue 1: "You're Offline" Showing on Landing Page

### Root Cause Analysis
The PWA (Progressive Web App) configuration in `vite.config.ts` uses `navigateFallback: '/offline.html'` which instructs the service worker to serve `offline.html` when navigation requests fail. However, the current setup has issues:

1. **Service Worker Caching Strategy**: The Workbox configuration is caching too aggressively during initial load
2. **navigateFallbackDenylist Too Limited**: Only `/api` and `/auth` are excluded, but the root path `/` isn't being handled properly during fresh loads
3. **Race Condition**: During first-time visits or hard refreshes, the service worker may intercept the request before the page can load, causing a brief flash of the offline page

### Solution: Fix PWA Configuration

**File: `vite.config.ts`**

Changes needed:
```text
1. Add the root path and common navigation routes to navigateFallbackDenylist
2. Configure the service worker to only activate fallback after a genuine network failure
3. Set networkTimeoutSeconds for navigation requests to prevent premature offline fallback
4. Disable navigateFallback for initial page loads by using more restrictive matching
```

```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  // Add navigation fallback only when truly offline
  navigateFallback: '/offline.html',
  // Exclude all app routes from fallback - only serve offline.html for true network failures
  navigateFallbackDenylist: [
    /^\/api/, 
    /^\/auth/,
    /^\/$/,          // Exclude root
    /^\/dashboard/,
    /^\/marketplace/,
    /^\/onboarding/,
  ],
  // Add handler for navigation with proper timeout
  runtimeCaching: [
    // Add navigation handler BEFORE other handlers
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkOnly',  // Never cache navigation - always go to network
      options: {
        networkTimeoutSeconds: 10,
      },
    },
    // ... existing runtime caching rules
  ],
}
```

---

## Issue 2: Build Errors - Missing RPC Functions

### Root Cause
The services are calling RPC functions that don't exist in the database:
- `create_order` - Not in `Database['public']['Functions']`
- `update_order_status` - Not in `Database['public']['Functions']`
- `create_invite` - Not in `Database['public']['Functions']`
- `claim_org_membership` - Not in `Database['public']['Functions']`

These functions were anticipated but never created in the backend.

### Solution: Two-Part Fix

**Part A: Frontend - Use Direct Reads or Stub the Functions**

Since these are mutations the frontend shouldn't perform directly (per protocol), we need to either:
1. Create placeholder implementations that throw "Not Implemented" errors
2. Use a type assertion to bypass the type checker while the backend catches up

**Recommended Approach**: Cast to `any` with clear documentation that these require backend RPC creation.

**File: `src/services/orders.service.ts`**
```typescript
// Mark as pending backend implementation
// @ts-expect-error - RPC 'create_order' pending backend creation
const { data, error } = await supabase.rpc('create_order' as any, { ... });
```

**File: `src/services/organizations.service.ts`**
```typescript
// For create_invite and claim_org_membership
// @ts-expect-error - RPC pending backend creation
```

**Part B: Backend - Request RPC Creation (Out of Scope for Lovable)**

The following RPCs need to be created by the Replit backend agent:
- `create_order(p_supplier_id, p_total_amount, p_currency, p_quote_id, p_org_id)`
- `update_order_status(p_order_id, p_status, p_payment_status)`
- `create_invite(p_org_id, p_email, p_role)`
- `claim_org_membership(p_org_id, p_invite_token)`

---

## Issue 3: Continuing from the Gating Rewrite

### Current Status (Per `.lovable/plan.md`)
- **Phase 1 (DB Foundation)**: COMPLETE
- **Phase 2 (RLS Hardening)**: COMPLETE (migration applied)
- **Phase 3 (Backend Enforcement)**: COMPLETE (telebuy-guard deployed)
- **Phase 4 (Frontend Cleanup)**: COMPLETE
- **Onboarding Integration**: COMPLETE

### Remaining Work
- **Phase 5 (Testing)**: Unit tests for RPC functions
- **Notion MCP Integration**: Not yet connected
- **MCP Runs Logging**: Table created, needs integration into edge functions

### Next Steps
1. Connect Notion MCP for automated task tracking
2. Integrate `log_mcp_run()` / `complete_mcp_run()` calls into AI-related edge functions
3. Create unit tests for gating RPCs

---

## Implementation Order

| Step | Task | File(s) Affected |
|------|------|------------------|
| 1 | Fix PWA navigateFallback configuration | `vite.config.ts` |
| 2 | Fix orders.service.ts type errors | `src/services/orders.service.ts` |
| 3 | Fix organizations.service.ts type errors | `src/services/organizations.service.ts` |
| 4 | Request Notion MCP connection | N/A (connector action) |
| 5 | Update plan.md with current status | `.lovable/plan.md` |

---

## Technical Details

### PWA Fix Rationale
The current `navigateFallback` behavior is too aggressive because:
1. Workbox's default behavior serves the fallback if the network request times out OR fails
2. On slow connections or during CDN propagation, this causes false-positive "offline" states
3. Setting `handler: 'NetworkOnly'` for navigation requests ensures we only get real HTML from the server

### Type Error Fix Pattern
```typescript
// Before (causes TS2345)
await supabase.rpc('create_order', { ... });

// After (documented pending backend)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
await (supabase.rpc as any)('create_order', { ... });
```

This is intentionally ugly to flag it as technical debt requiring backend work.

---

## Dependencies and Blockers

| Blocker | Owner | Resolution |
|---------|-------|------------|
| Missing RPCs (create_order, etc.) | Replit Backend | Create SQL functions |
| Notion MCP Connection | User Approval | Connector linking |

---

## Success Criteria

After implementation:
- Landing page (`/`) loads without offline flash
- Build passes with no TypeScript errors
- PWA only shows offline.html when genuinely offline
- Task tracking ready via Notion integration

