

# Gating Rewrite Pack: Analysis and Implementation Plan

## Executive Summary

Your proposed gating architecture is **fundamentally sound** and addresses real security gaps. However, there are key adjustments needed to align with what already exists, avoid breaking changes, and ensure the spec is implementable within LithiumBuy's architecture constraints.

---

## Part 1: What to KEEP (Excellent Design Decisions)

### 1.1 Identity Layer Separation (Keep as-is)
The 5-layer identity model is correct:
- **Layer 1: Auth Identity** (auth.users) - Already exists
- **Layer 2: Onboarding Profile** - NEW, critical addition
- **Layer 3: Org Membership** - Already exists (`org_members`)
- **Layer 4: Capabilities** - NEW, replaces hardcoded permissions
- **Layer 5: Feature Flags** - Partially exists (`ai_feature_flags`, `release_gates`)

### 1.2 Super Admin Model (Keep, Refine)
```text
+------------------------+-----------------------------------+
| Proposed               | Verdict                           |
+------------------------+-----------------------------------+
| super_admins table     | KEEP - Critical security boundary |
| No UI exposure         | KEEP - SQL-only insertion         |
| Admin cannot bid/buy   | KEEP - Separation of duties       |
+------------------------+-----------------------------------+
```

### 1.3 TeleBuy Enforcement (Keep, Enhance)
The `requireTelebuyAccess()` middleware pattern is excellent. Keep all 7 checks:
1. Authentication required
2. Kill switch check
3. Super admin blocked from acting
4. Onboarding profile required
5. Org membership verified
6. Capability check
7. Profile type restriction

---

## Part 2: What to MODIFY

### 2.1 Profile Types - Simplify the Enum
**Current proposal:** 6 types (`buyer`, `supplier`, `broker`, `logistics_partner`, `investor_view`, `internal_staff`)

**Recommendation:** Reduce to 4 types for MVP:
```text
profile_type: 'buyer' | 'supplier' | 'soe' | 'investor'
```

**Rationale:**
- `broker` is a future feature, not MVP
- `logistics_partner` can be a capability on `supplier`
- `internal_staff` should be handled via `super_admins` table, not profile

### 2.2 Existing `user_roles` Table - Keep But Clarify Purpose
**Current state:** Database has `user_roles(id, user_id, role, created_at)` with `app_role` enum and `has_role()` function.

**Problem:** Your spec proposes separate `onboarding_profiles` + `capabilities` tables which overlap with this.

**Recommendation:** Use both strategically:
```text
+---------------------+----------------------------------------+
| Table               | Purpose                                |
+---------------------+----------------------------------------+
| user_roles          | System-assigned roles (admin checks)   |
| onboarding_profiles | User-declared intent (immutable)       |
| profile_capabilities| Derived capabilities from profile      |
+---------------------+----------------------------------------+
```

### 2.3 Capability Keys - Align with Existing Features
**Proposed capabilities are good, but add these missing ones:**
```text
- view_recycling (new recycling feature in nav)
- create_rfq
- view_deals
- manage_org (org owner operations)
- use_ai_studio
- view_data_hub
```

### 2.4 RLS Policy Naming - Fix Inconsistencies
Current database has mixed naming conventions. Standardize to:
```text
{table}_{operation}_{scope}
Examples:
- telebuy_sessions_select_org
- telebuy_sessions_insert_capability
- organizations_update_owner
```

---

## Part 3: What to REMOVE or DEFER

### 3.1 Remove: `org_capability_overrides` Table (Defer to Post-MVP)
**Proposed:** Per-org capability overrides managed by super admin.

**Recommendation:** DEFER. This adds complexity without immediate value. Capabilities should be profile-derived only for MVP. Per-org overrides can come in v2.

### 3.2 Remove: Immutable Profile via "New Account" Requirement
**Proposed:** "If someone needs a new profile -> new account"

**Recommendation:** MODIFY. Allow profile change via support ticket + super admin action, logged to `domain_events`. Forcing new accounts creates UX friction and data fragmentation.

### 3.3 Remove: ViewMode from LocalStorage
**Current code:** `RoleSwitcher.tsx` allows any user to switch between admin/supplier/buyer views via localStorage.

**This is a security risk!** The `viewMode` stored in localStorage can be manipulated.

**Recommendation:** 
1. Remove `RoleSwitcher` component entirely from production
2. OR restrict it to only super_admins for testing purposes
3. Derive view from `onboarding_profiles.profile` server-side

---

## Part 4: What to ADD

### 4.1 Add: `onboarding_profiles` Table
```sql
CREATE TYPE public.onboarding_profile_type AS ENUM (
  'buyer', 'supplier', 'soe', 'investor'
);

CREATE TABLE public.onboarding_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  profile onboarding_profile_type NOT NULL,
  declared_intent JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Read own, insert once, no updates
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_profiles_select_own" ON public.onboarding_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "onboarding_profiles_insert_once" ON public.onboarding_profiles
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() 
    AND NOT EXISTS (SELECT 1 FROM public.onboarding_profiles WHERE user_id = auth.uid())
  );
```

### 4.2 Add: `super_admins` Table
```sql
CREATE TABLE public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT
);

-- RLS: Read-only for super admins, NO write policies
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_read_self" ON public.super_admins
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );
```

### 4.3 Add: `capabilities` + `profile_capabilities` Tables
```sql
CREATE TABLE public.capabilities (
  key TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_capabilities (
  profile onboarding_profile_type NOT NULL,
  capability_key TEXT NOT NULL REFERENCES public.capabilities(key) ON DELETE CASCADE,
  PRIMARY KEY (profile, capability_key)
);
```

### 4.4 Add: Helper Functions
```sql
-- is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  );
$$;

-- get_user_profile()
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS onboarding_profile_type
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile FROM public.onboarding_profiles WHERE user_id = auth.uid();
$$;

-- has_capability()
CREATE OR REPLACE FUNCTION public.has_capability(p_capability TEXT)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE
      WHEN public.is_super_admin() THEN true
      ELSE EXISTS (
        SELECT 1 
        FROM public.profile_capabilities pc
        WHERE pc.profile = public.get_user_profile()
        AND pc.capability_key = p_capability
      )
    END;
$$;
```

### 4.5 Add: TeleBuy Enforcement Middleware (Edge Function)
Create `supabase/functions/telebuy-guard/index.ts`:

```typescript
// Enforce all 7 checks before any TeleBuy action
export async function requireTelebuyAccess(supabase, orgId: string) {
  // 1. Auth required
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "AUTH_REQUIRED" };

  // 2. Kill switch
  const { data: ff } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", "system_read_only")
    .maybeSingle();
  if (ff?.enabled) return { ok: false, code: "READ_ONLY" };

  // 3. Super admin blocked
  const { data: sa } = await supabase.rpc("is_super_admin");
  if (sa) return { ok: false, code: "ADMIN_BLOCKED" };

  // 4. Profile required
  const { data: profile } = await supabase.rpc("get_user_profile");
  if (!profile) return { ok: false, code: "PROFILE_REQUIRED" };

  // 5. Org membership
  const { data: isMember } = await supabase.rpc("is_org_member", { p_org_id: orgId });
  if (!isMember) return { ok: false, code: "NOT_ORG_MEMBER" };

  // 6. Capability check
  const { data: hasCap } = await supabase.rpc("has_capability", { p_capability: "use_telebuy" });
  if (!hasCap) return { ok: false, code: "FORBIDDEN" };

  // 7. Profile type restriction
  if (!["buyer", "supplier"].includes(profile)) {
    return { ok: false, code: "PROFILE_NOT_ALLOWED" };
  }

  return { ok: true, orgId, profile };
}
```

### 4.6 Add: Domain Events Table
```sql
CREATE TABLE public.domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX domain_events_org_time_idx ON public.domain_events(org_id, created_at DESC);
CREATE INDEX domain_events_entity_idx ON public.domain_events(entity_type, entity_id);
```

---

## Part 5: Frontend Changes Required

### 5.1 Update Onboarding Flow
Modify `src/pages/Onboarding.tsx` to:
1. Insert into `onboarding_profiles` table (immutable)
2. Remove ability to change role after creation
3. Store `declared_intent` JSON with onboarding answers

### 5.2 Remove or Restrict RoleSwitcher
```text
Option A: Remove entirely
  - Delete src/components/layout/RoleSwitcher.tsx
  - Remove from LayoutShell.tsx

Option B: Restrict to super admins (for testing)
  - Add is_super_admin() check before rendering
  - Log all role switches to domain_events
```

### 5.3 Update Permission Checks
Replace `src/lib/auth/permissions.ts` hardcoded permissions with capability-based checks:

```typescript
// Before (hardcoded)
canAccessAIStudio: role === 'admin'

// After (capability-based via RPC)
const { data: canAccess } = await supabase.rpc('has_capability', { 
  p_capability: 'use_ai_studio' 
});
```

### 5.4 Create `useCapability` Hook
```typescript
export function useCapability(capability: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['capability', user?.id, capability],
    queryFn: async () => {
      const { data } = await supabase.rpc('has_capability', { p_capability: capability });
      return data ?? false;
    },
    enabled: !!user,
  });
}
```

---

## Part 6: Migration Order

Execute in this sequence to avoid breaking changes:

```text
Phase 1: Database Foundation (Week 1)
├── Create onboarding_profiles table
├── Create super_admins table  
├── Create capabilities + profile_capabilities tables
├── Create helper functions (is_super_admin, get_user_profile, has_capability)
└── Seed capability mappings

Phase 2: RLS Hardening (Week 1)
├── Add telebuy_sessions capability-based insert policy
├── Update organizations policies
└── Add onboarding_profiles policies

Phase 3: Backend Enforcement (Week 2)
├── Create telebuy-guard Edge Function
├── Update telebuy.service.ts to use guard
└── Add domain_events logging

Phase 4: Frontend Cleanup (Week 2)
├── Update Onboarding.tsx to use onboarding_profiles
├── Remove/restrict RoleSwitcher
├── Create useCapability hook
└── Replace hardcoded permission checks

Phase 5: Testing & Validation (Week 3)
├── Unit tests for all RPCs
├── E2E test: onboarding -> TeleBuy flow
└── Security audit of RLS policies
```

---

## Part 7: Critical Safety Assertions (Verified)

After implementation, these MUST hold true:

| Assertion | Enforcement Mechanism |
|-----------|----------------------|
| User cannot switch onboarding profile | No UPDATE policy on onboarding_profiles |
| User cannot grant admin | No INSERT policy on super_admins |
| UI cannot unlock features | Capabilities checked via RPC, not localStorage |
| TeleBuy requires backend validation | telebuy-guard Edge Function |
| Admin cannot act as buyer/supplier | is_super_admin() check blocks TeleBuy |
| All power flows through backend | RLS + SECURITY DEFINER functions |

---

## Part 8: Immediate Actions

### Highest Priority (Do First)
1. Create `super_admins` table (locks down admin privilege)
2. Create `onboarding_profiles` table (immutable intent)
3. Remove or restrict `RoleSwitcher` component

### Medium Priority
4. Create capability tables and seed mappings
5. Create `has_capability()` function
6. Update TeleBuy service to use guard

### Lower Priority (Post-MVP)
7. Domain events table
8. MCP runs table
9. Per-org capability overrides

---

## Technical Specifications Summary

### New Tables (4)
- `super_admins`
- `onboarding_profiles`
- `capabilities`
- `profile_capabilities`

### New Functions (3)
- `is_super_admin()`
- `get_user_profile()`
- `has_capability(p_capability)`

### New Edge Functions (1)
- `telebuy-guard/index.ts`

### Frontend Changes (4)
- Update `Onboarding.tsx`
- Remove/restrict `RoleSwitcher.tsx`
- Create `useCapability` hook
- Update `permissions.ts`

### RLS Policy Updates (3 tables)
- `onboarding_profiles` (new)
- `telebuy_sessions` (add capability check)
- `super_admins` (new, read-only)

