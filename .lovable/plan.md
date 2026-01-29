# Gating Rewrite Pack - Implementation Status

## ✅ Phase 1: Database Foundation (COMPLETE)

### Tables Created
- [x] `super_admins` - Immutable super admin privilege table (SQL-only insertion)
- [x] `onboarding_profiles` - Immutable user intent with profile type enum
- [x] `capabilities` - Capability definitions
- [x] `profile_capabilities` - Profile-to-capability mappings
- [x] `domain_events` - Audit trail for system events

### RLS Policies Added
- [x] `super_admins_read_self` - Super admins can only read their own entry
- [x] `onboarding_profiles_select_own` - Users can read their own profile
- [x] `onboarding_profiles_insert_once` - Users can insert profile once (immutable)
- [x] `capabilities_read_all` - All authenticated users can read capabilities
- [x] `profile_capabilities_read_all` - All authenticated users can read mappings
- [x] `domain_events_read_org` - Org members can read their org's events

### Helper Functions Created
- [x] `is_super_admin()` - Check if current user is super admin
- [x] `get_user_profile()` - Get user's onboarding profile type
- [x] `has_capability(p_capability)` - Check if user has a specific capability

### Capabilities Seeded (16 total)
| Capability | Description |
|------------|-------------|
| view_carbon_calc | Can view carbon calculator |
| run_carbon_calc | Can run & store carbon calculations |
| view_auctions | Can view auctions |
| place_bid | Can place auction bids |
| create_auction | Can create auctions |
| settle_auction | Can settle auctions (system only) |
| view_threepl | Can view 3PL inventory |
| sync_threepl | Can sync 3PL inventory (system/partner only) |
| use_telebuy | Can start TeleBuy sessions |
| admin_ops | Can perform admin ops (super admin only) |
| view_recycling | Can view recycling features |
| create_rfq | Can create RFQs |
| view_deals | Can view deals |
| manage_org | Can manage organization settings |
| use_ai_studio | Can access AI Studio features |
| view_data_hub | Can access Data Hub |

### Profile Capability Mappings
| Profile | Capabilities |
|---------|-------------|
| buyer | view_carbon_calc, run_carbon_calc, view_auctions, place_bid, view_threepl, use_telebuy, create_rfq, view_deals, view_recycling |
| supplier | view_carbon_calc, run_carbon_calc, view_auctions, create_auction, view_threepl, use_telebuy, view_deals, view_recycling, sync_threepl |
| soe | All buyer + supplier capabilities (hybrid) |
| investor | view_carbon_calc, view_auctions, view_threepl, view_recycling (read-only) |

---

## ✅ Phase 3: Backend Enforcement (COMPLETE)

### TeleBuy Guard Edge Function
- [x] Created `supabase/functions/telebuy-guard/index.ts`
- [x] Implements 7-check enforcement:
  1. Authentication required
  2. Kill switch (system_read_only feature flag)
  3. Super admin blocked from acting
  4. Onboarding profile required
  5. Org membership verified
  6. Capability check (use_telebuy)
  7. Profile type restriction (buyer/supplier/soe only)
- [x] Logs successful access to domain_events
- [x] Deployed to Supabase

### Frontend Hooks Created
- [x] `src/hooks/useCapability.ts`
  - `useCapability(capability)` - Check single capability
  - `useCapabilities(capabilities[])` - Check multiple capabilities
  - `useSuperAdmin()` - Check super admin status
  - `useUserProfile()` - Get user's onboarding profile type

- [x] `src/hooks/useTelebuyGuard.ts`
  - `checkAccess(action)` - Verify TeleBuy access via Edge Function
  - `checkAccessWithFeedback(action)` - Verify with toast feedback

---

## ✅ Phase 4: Frontend Cleanup (COMPLETE)

### RoleSwitcher Restricted
- [x] Updated `src/components/layout/RoleSwitcher.tsx`
- [x] Now only visible to super admins
- [x] Uses `useSuperAdmin()` hook for server-validated check
- [x] Displays "[ADMIN TEST MODE]" label to indicate testing context
- [x] Prevents privilege escalation via localStorage manipulation

---

## ✅ Phase 2: RLS Hardening (COMPLETE)

### TeleBuy Sessions RLS Policies
- [x] `telebuy_sessions_select_org` - Org members can view their sessions
- [x] `telebuy_sessions_insert_capability` - Requires `use_telebuy` capability to insert
- [x] `telebuy_sessions_update_org` - Requires `use_telebuy` capability to update
- [x] `telebuy_sessions_delete_org` - Requires `use_telebuy` capability to delete

### MCP Runs Audit Table
- [x] Created `mcp_runs` table for AI agent audit logging
- [x] Columns: run_id, agent_name, tool_name, org_id, user_id, input/output payloads, status, metrics
- [x] RLS policies: admin read all, org members read their org's runs
- [x] RPC functions: `log_mcp_run()`, `complete_mcp_run()` with SECURITY DEFINER

---

## ✅ Onboarding Integration (COMPLETE)

- [x] Updated `src/pages/Onboarding.tsx` to insert into `onboarding_profiles`
- [x] Profile is locked immediately on creation (immutable)
- [x] Existing profile detection skips to org step
- [x] Shows warning if profile already exists
- [x] Stores declared_intent JSON with selection timestamp

---

## 📋 Remaining Tasks

### Phase 5: Testing & Validation (TODO)
- [ ] Unit tests for `is_super_admin()` RPC
- [ ] Unit tests for `get_user_profile()` RPC
- [ ] Unit tests for `has_capability()` RPC
- [ ] E2E test: onboarding -> TeleBuy flow
- [ ] Security audit of new RLS policies

---

## 🔒 Security Assertions (Verified by Architecture)

| Assertion | Enforcement Mechanism |
|-----------|----------------------|
| User cannot switch onboarding profile | No UPDATE policy on `onboarding_profiles` |
| User cannot grant admin | No INSERT policy on `super_admins` |
| UI cannot unlock features | Capabilities checked via RPC, not localStorage |
| TeleBuy requires backend validation | `telebuy-guard` Edge Function |
| Admin cannot act as buyer/supplier | `is_super_admin()` check blocks TeleBuy |
| All power flows through backend | RLS + SECURITY DEFINER functions |

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Identity Layers                           │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: auth.users (Supabase Auth) - Immutable user ID     │
│ Layer 2: onboarding_profiles - Immutable intent (profile)   │
│ Layer 3: org_members - Org-level collaboration              │
│ Layer 4: profile_capabilities - Derived capabilities        │
│ Layer 5: feature_flags - System-level toggles               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Enforcement Layer                          │
├─────────────────────────────────────────────────────────────┤
│ • is_super_admin() - SECURITY DEFINER function              │
│ • get_user_profile() - SECURITY DEFINER function            │
│ • has_capability() - SECURITY DEFINER function              │
│ • telebuy-guard - Edge Function with 7 checks               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│ • useCapability() hook - Queries has_capability() RPC       │
│ • useSuperAdmin() hook - Queries is_super_admin() RPC       │
│ • useTelebuyGuard() hook - Calls telebuy-guard function     │
│ • RoleSwitcher - Only visible to super admins               │
└─────────────────────────────────────────────────────────────┘
```

