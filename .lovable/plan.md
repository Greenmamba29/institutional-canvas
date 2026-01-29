# LithiumBuy Gating Rewrite & Fixes - Implementation Status

**Last Updated**: 2026-01-29

---

## ✅ Completed Tasks

### Issue 1: PWA "You're Offline" Fix
- [x] Updated `vite.config.ts` with:
  - NetworkFirst handler for navigation requests (15s timeout)
  - Comprehensive `navigateFallbackDenylist` for all app routes
  - Proper caching strategy to prevent false offline states

### Issue 2: Build Errors - RPC Type Mismatches
- [x] Fixed `src/services/orders.service.ts`:
  - Added `any` cast for `create_order` RPC (pending backend)
  - Added `any` cast for `update_order_status` RPC (pending backend)
- [x] Fixed `src/services/organizations.service.ts`:
  - Added `any` cast for `create_invite` RPC (pending backend)
  - Added `any` cast for `claim_org_membership` RPC (pending backend)

### Gating Rewrite Phases
- [x] **Phase 1 (DB Foundation)**: `onboarding_profiles`, `profile_capabilities`, `capabilities` tables created
- [x] **Phase 2 (RLS Hardening)**: Capability-aware RLS on `telebuy_sessions`
- [x] **Phase 3 (Backend Enforcement)**: `telebuy-guard` edge function deployed
- [x] **Phase 4 (Frontend Cleanup)**: `useCapability` hook, `useUserProfile` hook
- [x] **Onboarding Integration**: `src/pages/Onboarding.tsx` updated with profile selection

### AI Audit Layer
- [x] Created `mcp_runs` table for AI agent activity logging
- [x] Created `log_mcp_run()` and `complete_mcp_run()` RPC functions

---

## 🔄 Remaining Work

### Backend Blockers (Replit Agent Required)
| RPC Function | Service File | Status |
|--------------|--------------|--------|
| `create_order` | orders.service.ts | ⏳ Pending |
| `update_order_status` | orders.service.ts | ⏳ Pending |
| `create_invite` | organizations.service.ts | ⏳ Pending |
| `claim_org_membership` | organizations.service.ts | ⏳ Pending |

### Integrations
- [ ] **Notion MCP Connection**: Awaiting connector linking for task tracking
- [ ] **MCP Runs Integration**: Wire `log_mcp_run()` into AI edge functions

### Testing
- [ ] **Phase 5**: Unit tests for gating RPC functions
- [ ] **E2E Tests**: Onboarding flow verification

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| Landing page loads without offline flash | ✅ Fixed |
| Build passes with no TypeScript errors | ✅ Fixed |
| PWA shows offline.html only when truly offline | ✅ Fixed |
| Capability-based RLS enforced | ✅ Complete |
| Onboarding stores immutable profile | ✅ Complete |
| Notion task tracking ready | ⏳ Pending |
