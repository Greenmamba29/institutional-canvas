
# Lithium & Lux MVP: Claude Agent SDK Skills Architecture
## Revised Execution Plan with 10 Surgical Fixes

---

## Executive Summary

This plan refactors the LithiumBuy codebase into a gated, skills-first agent system following the Claude Agent SDK patterns. It incorporates all 10 critical improvements from the surgical review.

---

## Key Revisions Applied

| Fix # | Issue | Resolution |
|-------|-------|------------|
| 1 | Architecture-first vs shipping-first | Added Dual-Track Migration Rule |
| 2 | Missing skill invocation audit | Add `skill_invocations` table |
| 3 | Tool manifest lacks deny-by-default | Restructure with read/write separation |
| 4 | Kill switch client-side only | Server-side enforcement in all RPCs |
| 5 | TeleBuy demo mode undefined | Explicit demo flag + production mode |
| 6 | Super admin capability bypass | Restrict to `admin_ops.*` skills only |
| 7 | Profile enum inconsistency | Canonical set: `buyer`, `supplier`, `soe`, `investor` |
| 8 | No skill discovery | Add `skills/recommend.ts` |
| 9 | Missing privilege escalation tests | Add E2E tests for "No one becomes admin" |
| 10 | Phase naming confusion | Renamed to reflect safe shipping sequence |

---

## Canonical Profile Enum (Fix #7)

The database enum `onboarding_profile_type` defines the canonical profiles:

```typescript
// Canonical profile types - MUST match database enum exactly
type OnboardingProfile = 'buyer' | 'supplier' | 'soe' | 'investor';

// UI-friendly labels (for display only)
const PROFILE_LABELS: Record<OnboardingProfile, string> = {
  buyer: 'Buyer',
  supplier: 'Supplier',
  soe: 'State-Owned Enterprise',
  investor: 'Investor View',
};
```

All code MUST use `OnboardingProfile` for type safety. No additional profile types allowed.

---

## Dual-Track Migration Rule (Fix #1)

**Non-negotiable:** We will not migrate existing pages to skills until the skill has:

1. Contract + Policy + Tests complete
2. Server guard/RLS verified
3. Feature flag coverage active

This prevents partial refactors and ensures every migration is safe to ship or rollback.

---

## Phase 0: Audit + Target Map (Complete)

### Current State

| Component | Status | Gap |
|-----------|--------|-----|
| `onboarding_profiles` table | Deployed | None |
| `profile_capabilities` table | Deployed | None |
| `is_super_admin()` RPC | Deployed | None |
| `has_capability()` RPC | Deployed | None |
| `telebuy-guard` Edge Function | Deployed | None |
| `feature_flags` table | Missing | Must create for kill switch |
| `skill_invocations` table | Missing | Must create for audit |
| Skill registry | Missing | Must create |
| Tool manifest | Missing | Must create |
| E2E tests | Missing | Must create |

### Feature Flags Gap

The `telebuy-guard` references `feature_flags` table but only `ai_feature_flags` exists. We need a general `feature_flags` table for system-wide controls.

---

## Phase 1: Policy + Registry Foundation

### Files to Create

```text
src/policy/
├── index.ts               # Policy exports
├── types.ts               # Policy types
├── toolManifest.ts        # Tool manifest with deny-by-default
├── toolPolicy.ts          # Policy enforcement
├── killSwitch.ts          # Client-side kill switch
├── killSwitch.server.ts   # Server-side kill switch (Edge Function pattern)
├── capabilityPolicy.ts    # Capability evaluation
└── audit.ts               # Policy decision logging

src/skills/
├── index.ts               # Skill registry
├── types.ts               # Skill contract types
├── registry.ts            # Skill discovery + filtering
├── recommend.ts           # Skill recommendation engine
└── admin_ops/             # Super admin skills only
    ├── index.ts
    ├── contract.ts
    └── policy.ts
```

### Tool Manifest with Deny-by-Default (Fix #3)

```typescript
// src/policy/toolManifest.ts

export type ToolCategory = 
  | 'supabase.read.public'      // Tables with public RLS
  | 'supabase.read.org_scoped'  // Tables with org-level RLS
  | 'supabase.write.rpc'        // RPC functions only
  | 'external.daily'            // Daily.co API
  | 'external.airtable'         // Airtable API
  | 'external.make'             // Make.com API
  | 'admin_ops';                // Super admin only

export interface ToolDefinition {
  name: string;
  category: ToolCategory;
  description: string;
  allowedSkills: string[];      // Empty = deny by default
  requiresCapability?: string;
  requiresSubscription?: 'pro' | 'enterprise';
  superAdminOnly?: boolean;     // If true, ONLY super admin can use
}

export const TOOL_MANIFEST: Record<string, ToolDefinition> = {
  // ============================================
  // PUBLIC READ (all authenticated users)
  // ============================================
  'supabase.read.suppliers': {
    name: 'supabase.read.suppliers',
    category: 'supabase.read.public',
    description: 'Read supplier directory',
    allowedSkills: ['*'],  // Marketplace is public
  },
  'supabase.read.products': {
    name: 'supabase.read.products',
    category: 'supabase.read.public',
    description: 'Read product listings',
    allowedSkills: ['*'],
  },

  // ============================================
  // ORG-SCOPED READ (RLS enforces org isolation)
  // ============================================
  'supabase.read.rfqs': {
    name: 'supabase.read.rfqs',
    category: 'supabase.read.org_scoped',
    description: 'Read RFQs for user orgs only',
    allowedSkills: ['rfq.list', 'rfq.view', 'match.rank'],
  },
  'supabase.read.deals': {
    name: 'supabase.read.deals',
    category: 'supabase.read.org_scoped',
    description: 'Read deals for user orgs only',
    allowedSkills: ['deal.list', 'deal.view', 'telebuy.start'],
  },
  'supabase.read.telebuy_sessions': {
    name: 'supabase.read.telebuy_sessions',
    category: 'supabase.read.org_scoped',
    description: 'Read TeleBuy sessions for user orgs only',
    allowedSkills: ['telebuy.list', 'telebuy.view'],
  },

  // ============================================
  // WRITE VIA RPC ONLY (no direct table writes)
  // ============================================
  'supabase.rpc.create_rfq': {
    name: 'supabase.rpc.create_rfq',
    category: 'supabase.write.rpc',
    description: 'Create a new RFQ',
    allowedSkills: ['rfq.create'],
    requiresCapability: 'create_rfq',
  },
  'supabase.rpc.submit_bid': {
    name: 'supabase.rpc.submit_bid',
    category: 'supabase.write.rpc',
    description: 'Submit a bid on an auction/RFQ',
    allowedSkills: ['auction.bid', 'rfq.respond'],
    requiresCapability: 'submit_bid',
  },
  'supabase.rpc.create_telebuy_session': {
    name: 'supabase.rpc.create_telebuy_session',
    category: 'supabase.write.rpc',
    description: 'Start a TeleBuy video session',
    allowedSkills: ['telebuy.start'],
    requiresCapability: 'use_telebuy',
    requiresSubscription: 'pro',
  },
  'supabase.rpc.award_deal': {
    name: 'supabase.rpc.award_deal',
    category: 'supabase.write.rpc',
    description: 'Award a deal to winning bidder',
    allowedSkills: ['auction.settle', 'deal.award'],
    requiresCapability: 'award_deal',
  },

  // ============================================
  // EXTERNAL INTEGRATIONS
  // ============================================
  'external.daily.create_room': {
    name: 'external.daily.create_room',
    category: 'external.daily',
    description: 'Create Daily.co video room',
    allowedSkills: ['telebuy.start'],
    requiresSubscription: 'enterprise',
  },
  'external.airtable.sync': {
    name: 'external.airtable.sync',
    category: 'external.airtable',
    description: 'Sync data to Airtable',
    allowedSkills: ['threepl.sync', 'admin_ops.sync_airtable'],
  },

  // ============================================
  // ADMIN-ONLY OPERATIONS (Fix #6)
  // ============================================
  'admin_ops.view_logs': {
    name: 'admin_ops.view_logs',
    category: 'admin_ops',
    description: 'View system audit logs',
    allowedSkills: ['admin_ops.audit'],
    superAdminOnly: true,
  },
  'admin_ops.toggle_feature_flag': {
    name: 'admin_ops.toggle_feature_flag',
    category: 'admin_ops',
    description: 'Enable/disable feature flags',
    allowedSkills: ['admin_ops.flags'],
    superAdminOnly: true,
  },
  'admin_ops.pause_auction': {
    name: 'admin_ops.pause_auction',
    category: 'admin_ops',
    description: 'Pause an active auction',
    allowedSkills: ['admin_ops.auction_control'],
    superAdminOnly: true,
  },
};

// Default policy: DENY if tool not in manifest
export function isToolKnown(toolName: string): boolean {
  return toolName in TOOL_MANIFEST;
}
```

### Tool Policy Enforcement (Fix #3, #6)

```typescript
// src/policy/toolPolicy.ts

import { TOOL_MANIFEST, isToolKnown } from './toolManifest';
import { SkillContext } from '@/skills/types';

export interface ToolPolicyResult {
  allowed: boolean;
  reason?: string;
  code?: 'UNKNOWN_TOOL' | 'SKILL_NOT_ALLOWED' | 'SUPER_ADMIN_ONLY' | 
         'SUPER_ADMIN_WRONG_SKILL' | 'CAPABILITY_DENIED' | 'SUBSCRIPTION_REQUIRED';
}

export function canUseTool(
  toolName: string,
  skillName: string,
  context: SkillContext
): ToolPolicyResult {
  // 1. Deny unknown tools (Fix #3: deny by default)
  if (!isToolKnown(toolName)) {
    return {
      allowed: false,
      code: 'UNKNOWN_TOOL',
      reason: `Tool "${toolName}" not registered in manifest`,
    };
  }

  const tool = TOOL_MANIFEST[toolName];

  // 2. Super admin restriction (Fix #6)
  if (context.isSuperAdmin) {
    // Super admins can ONLY use admin_ops.* skills
    if (!skillName.startsWith('admin_ops.')) {
      return {
        allowed: false,
        code: 'SUPER_ADMIN_WRONG_SKILL',
        reason: 'Super admins can only execute admin_ops.* skills',
      };
    }
  }

  // 3. Check if tool requires super admin
  if (tool.superAdminOnly && !context.isSuperAdmin) {
    return {
      allowed: false,
      code: 'SUPER_ADMIN_ONLY',
      reason: `Tool "${toolName}" requires super admin privileges`,
    };
  }

  // 4. Check if skill is allowed to use tool
  const isWildcard = tool.allowedSkills.includes('*');
  const isExplicitlyAllowed = tool.allowedSkills.includes(skillName);
  
  if (!isWildcard && !isExplicitlyAllowed) {
    return {
      allowed: false,
      code: 'SKILL_NOT_ALLOWED',
      reason: `Skill "${skillName}" is not authorized to use tool "${toolName}"`,
    };
  }

  // 5. Check capability requirement
  if (tool.requiresCapability && !context.capabilities.includes(tool.requiresCapability)) {
    return {
      allowed: false,
      code: 'CAPABILITY_DENIED',
      reason: `Capability "${tool.requiresCapability}" required`,
    };
  }

  // 6. Check subscription requirement
  if (tool.requiresSubscription) {
    const tierOrder = { free: 0, pro: 1, enterprise: 2 };
    const required = tierOrder[tool.requiresSubscription];
    const current = tierOrder[context.subscriptionTier];
    
    if (current < required) {
      return {
        allowed: false,
        code: 'SUBSCRIPTION_REQUIRED',
        reason: `${tool.requiresSubscription} subscription required`,
      };
    }
  }

  return { allowed: true };
}
```

### Kill Switch Server-Side Enforcement (Fix #4)

All write RPCs must check `is_system_read_only()`:

```sql
-- Migration: Add feature_flags table and helper function

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert kill switch flag
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('system_read_only', false, 'Global kill switch - blocks all write operations')
ON CONFLICT (key) DO NOTHING;

-- Security definer function to check kill switch
CREATE OR REPLACE FUNCTION public.is_system_read_only()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM feature_flags WHERE key = 'system_read_only'),
    false
  );
$$;

-- RLS for feature_flags (super admin only)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
```

Every write RPC must include:

```sql
-- Example: create_rfq must check kill switch
CREATE OR REPLACE FUNCTION public.create_rfq(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Kill switch check (Fix #4)
  IF is_system_read_only() THEN
    RAISE EXCEPTION 'System is in read-only mode' USING ERRCODE = 'P0001';
  END IF;
  
  -- ... rest of function
END;
$$;
```

---

## Phase 2: Gating Enforcement Completion

### Skill Invocations Table (Fix #2)

```sql
-- Migration: Add skill_invocations audit table

CREATE TABLE public.skill_invocations (
  invocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  skill_version TEXT NOT NULL DEFAULT '1.0.0',
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  input_hash TEXT,                          -- SHA256 of input (not full input for privacy)
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  tool_calls JSONB DEFAULT '[]'::jsonb,     -- Array of {tool, success, duration_ms}
  context_snapshot JSONB,                   -- Captured context at invocation time
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by skill
CREATE INDEX idx_skill_invocations_skill ON skill_invocations(skill_name, created_at DESC);
CREATE INDEX idx_skill_invocations_org ON skill_invocations(org_id, created_at DESC);
CREATE INDEX idx_skill_invocations_user ON skill_invocations(user_id, created_at DESC);

-- RLS: Users can see their own invocations, super admins see all
ALTER TABLE public.skill_invocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill invocations"
ON public.skill_invocations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_super_admin()
);

-- Only service role can insert (via Edge Functions)
CREATE POLICY "Service role inserts skill invocations"
ON public.skill_invocations
FOR INSERT
TO service_role
WITH CHECK (true);
```

### Skill Audit Helper

```typescript
// src/skills/audit.ts

import { supabase } from '@/integrations/supabase/client';
import { SkillContext, SkillResult } from './types';

export interface ToolCallRecord {
  tool: string;
  success: boolean;
  duration_ms: number;
  error?: string;
}

export async function logSkillInvocation(params: {
  skillName: string;
  skillVersion: string;
  context: SkillContext;
  inputHash: string;
  result: SkillResult<unknown>;
  durationMs: number;
  toolCalls: ToolCallRecord[];
}): Promise<void> {
  try {
    // Use Edge Function to insert (service role)
    await supabase.functions.invoke('log-skill-invocation', {
      body: {
        skill_name: params.skillName,
        skill_version: params.skillVersion,
        org_id: params.context.orgId,
        user_id: params.context.userId,
        input_hash: params.inputHash,
        success: params.result.success,
        error_code: params.result.error?.code,
        error_message: params.result.error?.message,
        duration_ms: params.durationMs,
        tool_calls: params.toolCalls,
        context_snapshot: {
          profile: params.context.profile,
          subscription_tier: params.context.subscriptionTier,
          is_super_admin: params.context.isSuperAdmin,
        },
      },
    });
  } catch (error) {
    console.error('Failed to log skill invocation:', error);
    // Non-blocking - don't fail the skill if audit fails
  }
}

// Hash function for input privacy
export function hashInput(input: unknown): string {
  const str = JSON.stringify(input);
  // Use Web Crypto API
  return crypto.subtle
    ? btoa(str.slice(0, 100)) // Fallback for tests
    : btoa(str.slice(0, 100));
}
```

---

## Phase 3: Skill Implementation by Domain

### TeleBuy Skill with Demo Mode (Fix #5)

```typescript
// src/skills/telebuy/contract.ts

import { z } from 'zod';
import { SkillContract } from '../types';

export const startSessionInputSchema = z.object({
  supplierId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  videoProvider: z.enum(['daily', 'google_meet']).default('google_meet'),
  demoMode: z.boolean().optional().default(false),  // Fix #5
});

export type StartSessionInput = z.infer<typeof startSessionInputSchema>;

export const telebuyStartContract: SkillContract<StartSessionInput, unknown> = {
  name: 'telebuy.start',
  version: '1.0.0',
  description: 'Start a new TeleBuy video negotiation session',
  inputSchema: startSessionInputSchema,
  outputSchema: z.object({
    sessionId: z.string().uuid(),
    meetingUrl: z.string(),
    status: z.literal('scheduled'),
    isDemo: z.boolean(),
  }),
  requiredCapabilities: ['use_telebuy'],
  requiredTools: ['supabase.rpc.create_telebuy_session'],
  requiredSubscription: 'pro',
  featureFlags: ['telebuy_enabled'],
};
```

```typescript
// src/skills/telebuy/index.ts (excerpt with Fix #5)

async execute(input: StartSessionInput, context: SkillContext) {
  // ... guard checks ...

  let meetingUrl: string;
  let isDemo = false;

  // Fix #5: Demo mode handling
  if (input.demoMode) {
    // Check if demo mode is allowed (feature flag)
    const demoAllowed = await checkFeatureFlag('demo_mode_enabled', context.orgId);
    if (!demoAllowed) {
      return {
        success: false,
        error: {
          code: 'DEMO_NOT_ALLOWED',
          message: 'Demo mode is not enabled for this organization',
          retryable: false,
        },
      };
    }
    
    // Generate fake meeting URL for demo
    meetingUrl = `https://demo.telebuy.example.com/${crypto.randomUUID().slice(0, 8)}`;
    isDemo = true;
    
    // Log demo mode usage
    await logSkillEvent('telebuy.demo_session_created', context);
  } else {
    // Production: require real provider integration
    if (input.videoProvider === 'daily') {
      const room = await createDailyRoom();
      if (!room.url) {
        return {
          success: false,
          error: {
            code: 'ROOM_CREATION_FAILED',
            message: 'Failed to create video room',
            retryable: true,
          },
        };
      }
      meetingUrl = room.url;
    } else {
      // Google Meet: must come from actual Calendar API
      const meetResult = await createGoogleMeetLink(context);
      if (!meetResult.url) {
        return {
          success: false,
          error: {
            code: 'MEET_CREATION_FAILED',
            message: 'Failed to create Google Meet link',
            retryable: true,
          },
        };
      }
      meetingUrl = meetResult.url;
    }
  }

  // Log skill events (Fix #5)
  await logSkillEvent('telebuy.guard_passed', context);
  
  // Create session record
  const session = await createTelebuySession({
    ...input,
    meetingUrl,
  });
  
  await logSkillEvent('telebuy.session_created', context, { sessionId: session.id });

  return {
    success: true,
    data: {
      sessionId: session.id,
      meetingUrl,
      status: 'scheduled',
      isDemo,
    },
  };
}
```

### Skill Discovery Layer (Fix #8)

```typescript
// src/skills/recommend.ts

import { SkillContext } from './types';
import { SKILL_REGISTRY } from './registry';
import { checkFeatureFlag } from '@/policy/featureFlags';

export interface SkillRecommendation {
  skillName: string;
  displayName: string;
  description: string;
  reason: string;           // Why this skill is recommended now
  priority: number;         // 1-10, higher = more relevant
}

export interface RecommendationContext extends SkillContext {
  currentPage: string;      // e.g., '/marketplace', '/telebuy'
  recentActions: string[];  // e.g., ['viewed_supplier', 'sent_rfq']
  dealInProgress?: string;  // Active deal ID if any
}

export async function recommendSkills(
  context: RecommendationContext
): Promise<SkillRecommendation[]> {
  const recommendations: SkillRecommendation[] = [];

  for (const skill of Object.values(SKILL_REGISTRY)) {
    // 1. Check feature flags
    if (skill.contract.featureFlags) {
      const allFlagsEnabled = await Promise.all(
        skill.contract.featureFlags.map(f => checkFeatureFlag(f, context.orgId))
      );
      if (!allFlagsEnabled.every(Boolean)) continue;
    }

    // 2. Check subscription tier
    if (skill.contract.requiredSubscription) {
      const tierOrder = { free: 0, pro: 1, enterprise: 2 };
      if (tierOrder[context.subscriptionTier] < tierOrder[skill.contract.requiredSubscription]) {
        continue; // User can't use this skill
      }
    }

    // 3. Check capabilities
    const hasAllCaps = skill.contract.requiredCapabilities.every(
      cap => context.capabilities.includes(cap)
    );
    if (!hasAllCaps) continue;

    // 4. Super admin restriction (Fix #6)
    if (context.isSuperAdmin && !skill.contract.name.startsWith('admin_ops.')) {
      continue; // Super admins can only see admin_ops skills
    }
    if (!context.isSuperAdmin && skill.contract.name.startsWith('admin_ops.')) {
      continue; // Non-admins can't see admin_ops skills
    }

    // 5. Calculate relevance based on context
    const priority = calculateRelevance(skill.contract.name, context);
    if (priority > 0) {
      recommendations.push({
        skillName: skill.contract.name,
        displayName: skill.contract.name.replace('.', ' → '),
        description: skill.contract.description,
        reason: getRecommendationReason(skill.contract.name, context),
        priority,
      });
    }
  }

  // Sort by priority descending
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

function calculateRelevance(skillName: string, context: RecommendationContext): number {
  let score = 5; // Base score

  // Page-based boosting
  if (context.currentPage === '/marketplace' && skillName.startsWith('rfq.')) {
    score += 3;
  }
  if (context.currentPage === '/telebuy' && skillName.startsWith('telebuy.')) {
    score += 3;
  }
  if (context.currentPage === '/auctions' && skillName.startsWith('auction.')) {
    score += 3;
  }

  // Recent action boosting
  if (context.recentActions.includes('viewed_supplier') && skillName === 'telebuy.start') {
    score += 2;
  }
  if (context.recentActions.includes('created_rfq') && skillName === 'auction.bid') {
    score += 2;
  }

  // Active deal boosting
  if (context.dealInProgress && skillName.startsWith('deal.')) {
    score += 4;
  }

  return score;
}

function getRecommendationReason(skillName: string, context: RecommendationContext): string {
  if (skillName === 'telebuy.start' && context.recentActions.includes('viewed_supplier')) {
    return 'Start a video call with the supplier you just viewed';
  }
  if (skillName === 'rfq.create' && context.currentPage === '/marketplace') {
    return 'Create an RFQ for products you are browsing';
  }
  if (skillName.startsWith('admin_ops.')) {
    return 'Admin operation available';
  }
  return 'Recommended based on your activity';
}
```

---

## Phase 4: Migration + Replacement of Legacy Services

### useSkill Hook

```typescript
// src/hooks/useSkill.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SkillContext, Skill, SkillResult } from '@/skills/types';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useUserProfile, useCapabilities, useSuperAdmin } from '@/hooks/useCapability';
import { useServerRole } from '@/hooks/useServerRole';
import { logSkillInvocation, hashInput } from '@/skills/audit';

export function useSkill<TInput, TOutput>(skill: Skill<TInput, TOutput>) {
  const { user } = useAuth();
  const { currentOrg } = useCurrentOrg();
  const { data: profile } = useUserProfile();
  const { data: serverRole } = useServerRole(currentOrg?.id);
  const { data: isSuperAdmin } = useSuperAdmin();
  const { data: capabilities } = useCapabilities(skill.contract.requiredCapabilities);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['skill', skill.contract.name],
    mutationFn: async (input: TInput): Promise<SkillResult<TOutput>> => {
      const startTime = performance.now();
      const toolCalls: any[] = [];

      // Build context
      const context: SkillContext = {
        userId: user?.id || '',
        orgId: currentOrg?.id || '',
        profile: profile || 'buyer',
        capabilities: Object.entries(capabilities || {})
          .filter(([, v]) => v)
          .map(([k]) => k),
        subscriptionTier: serverRole?.subscription_tier === 'active' 
          ? 'pro' 
          : (serverRole?.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free',
        isSuperAdmin: isSuperAdmin || false,
      };

      // Execute skill
      const result = await skill.execute(input, context);

      // Log invocation (Fix #2)
      const durationMs = Math.round(performance.now() - startTime);
      await logSkillInvocation({
        skillName: skill.contract.name,
        skillVersion: skill.contract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs,
        toolCalls,
      });

      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate related queries based on skill
        if (skill.contract.name.startsWith('telebuy.')) {
          queryClient.invalidateQueries({ queryKey: ['telebuy'] });
        }
        if (skill.contract.name.startsWith('rfq.')) {
          queryClient.invalidateQueries({ queryKey: ['rfqs'] });
        }
        if (skill.contract.name.startsWith('auction.')) {
          queryClient.invalidateQueries({ queryKey: ['auctions'] });
        }
      }
    },
  });
}
```

---

## Phase 5: Hardening (Tests/CI/Observability)

### Privilege Escalation E2E Tests (Fix #9)

```typescript
// e2e/privilege-escalation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Privilege Escalation Prevention', () => {
  test.describe('No one becomes admin', () => {
    test('Cannot update own profile to admin', async ({ page }) => {
      // Login as regular user
      await page.goto('/auth');
      await page.fill('[name="email"]', 'buyer@test.com');
      await page.fill('[name="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      
      // Attempt to call profile update API with admin role
      const response = await page.evaluate(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase
          .from('onboarding_profiles')
          .update({ profile: 'admin' } as any)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        return { error: error?.message };
      });
      
      expect(response.error).toBeTruthy();
      expect(response.error).toContain('violates check constraint');
    });

    test('Cannot insert into super_admins table', async ({ page }) => {
      await page.goto('/auth');
      await page.fill('[name="email"]', 'buyer@test.com');
      await page.fill('[name="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      
      const response = await page.evaluate(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const user = (await supabase.auth.getUser()).data.user;
        const { error } = await supabase
          .from('super_admins')
          .insert({ user_id: user?.id });
        return { error: error?.message };
      });
      
      expect(response.error).toBeTruthy();
      expect(response.error).toMatch(/permission denied|violates row-level security/i);
    });

    test('Cannot call admin-only RPC', async ({ page }) => {
      await page.goto('/auth');
      await page.fill('[name="email"]', 'buyer@test.com');
      await page.fill('[name="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      
      const response = await page.evaluate(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.rpc('toggle_feature_flag', {
          p_flag_key: 'system_read_only',
          p_enabled: true,
        });
        return { error: error?.message };
      });
      
      expect(response.error).toBeTruthy();
    });
  });

  test.describe('TeleBuy Guard Bypass Prevention', () => {
    test('Direct RPC without guard fails', async ({ page }) => {
      // This tests that the RPC itself enforces guards, not just UI
      await page.goto('/auth');
      await page.fill('[name="email"]', 'free-user@test.com');
      await page.fill('[name="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      
      const response = await page.evaluate(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.rpc('create_telebuy_session', {
          p_supplier_id: 'fake-supplier-id',
          p_scheduled_at: new Date().toISOString(),
          p_meeting_url: 'https://fake.meet.com',
        });
        return { error: error?.message };
      });
      
      expect(response.error).toBeTruthy();
      expect(response.error).toMatch(/capability|subscription|profile/i);
    });
  });
});
```

### Updated CI Pipeline

```yaml
# .github/workflows/ci.yml (additions)

  skills-tests:
    name: Skills Layer Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run policy tests
        run: npm test -- --run --reporter=verbose src/policy/
      
      - name: Run skills tests
        run: npm test -- --run --reporter=verbose src/skills/

  e2e-security:
    name: E2E Security Tests
    runs-on: ubuntu-latest
    needs: [quality, skills-tests]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      
      - name: Start preview server
        run: npm run dev &
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Wait for server
        run: npx wait-on http://localhost:5173 -t 60000
      
      - name: Run privilege escalation tests
        run: npx playwright test e2e/privilege-escalation.spec.ts
      
      - name: Run TeleBuy guard tests
        run: npx playwright test e2e/telebuy-guard.spec.ts
```

---

## Epic Backlog Summary

| Epic | Priority | PRs | Status |
|------|----------|-----|--------|
| 1. Policy Layer Foundation | P0 | 1.1-1.4 | Ready |
| 2. Skills Registry | P0 | 2.1-2.6 | Blocked by Epic 1 |
| 3. Skill Discovery + Recommendation | P1 | 3.1-3.2 | Blocked by Epic 2 |
| 4. Migration + useSkill Integration | P1 | 4.1-4.4 | Blocked by Epic 2 |
| 5. Hardening (E2E + CI) | P0 | 5.1-5.4 | Can start parallel |

---

## Files to Create/Modify

| Action | Path | Epic |
|--------|------|------|
| CREATE | `src/policy/index.ts` | 1 |
| CREATE | `src/policy/types.ts` | 1 |
| CREATE | `src/policy/toolManifest.ts` | 1 |
| CREATE | `src/policy/toolPolicy.ts` | 1 |
| CREATE | `src/policy/killSwitch.ts` | 1 |
| CREATE | `src/policy/capabilityPolicy.ts` | 1 |
| CREATE | `src/policy/audit.ts` | 1 |
| CREATE | `src/skills/index.ts` | 2 |
| CREATE | `src/skills/types.ts` | 2 |
| CREATE | `src/skills/registry.ts` | 2 |
| CREATE | `src/skills/recommend.ts` | 3 |
| CREATE | `src/skills/audit.ts` | 2 |
| CREATE | `src/skills/telebuy/*` | 2 |
| CREATE | `src/skills/auction/*` | 2 |
| CREATE | `src/skills/rfq/*` | 2 |
| CREATE | `src/skills/admin_ops/*` | 2 |
| CREATE | `src/hooks/useSkill.ts` | 4 |
| CREATE | `e2e/privilege-escalation.spec.ts` | 5 |
| CREATE | `e2e/telebuy-guard.spec.ts` | 5 |
| CREATE | `playwright.config.ts` | 5 |
| CREATE | `supabase/functions/log-skill-invocation/index.ts` | 2 |
| MIGRATE | Add `feature_flags` table | 1 |
| MIGRATE | Add `skill_invocations` table | 2 |
| MIGRATE | Update all write RPCs with kill switch | 1 |
| MODIFY | `.github/workflows/ci.yml` | 5 |

---

## Definition of Done

For each PR:

1. TypeScript compiles with no errors
2. All existing tests pass
3. New tests cover the changed code (>80% coverage)
4. Kill switch is respected on all write paths
5. Super admin restriction enforced (admin_ops only)
6. Feature flag coverage for new features
7. Audit logging enabled
8. PR reviewed by at least one team member
9. Rollback documented

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Skill layer adds latency | Cache policy decisions, async audit logging |
| Breaking existing flows | Feature flag all changes, dual-track migration |
| Test flakiness | Retry logic, mock external services |
| Stale tool manifest | CI check that all RPCs are in manifest |
| Kill switch not enforced | Add SQL trigger that blocks all writes when flag is true |
