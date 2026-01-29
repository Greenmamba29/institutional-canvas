# MIT-Level Gap Analysis: LithiumBuy Platform
## Senior Product Feature Review & MVP Productivity Assessment

**Date:** January 29, 2026
**Analysis Type:** Comprehensive Data Connectivity & Onboarding Workflow Review
**Focus:** MVP Productivity Stemming from Data Connectivity

---

## Executive Summary

This analysis identifies **23 critical gaps** across three domains: Onboarding Workflow, Data Connectivity, and Product Features. The platform has a solid foundation with React Query + Supabase architecture, but several blocking issues prevent MVP launch readiness.

### Critical Blockers (Must Fix)
| Gap | Impact | Effort |
|-----|--------|--------|
| Orders RPC not implemented | Cannot create/update orders | High |
| Invite token validation missing | Security vulnerability | Medium |
| TeleBuy session RPC missing | Feature incomplete | Medium |
| Real-time messaging gaps | Poor UX | Medium |

---

## 1. ONBOARDING WORKFLOW ANALYSIS

### 1.1 Current Flow Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Welcome   │────▶│    Role     │────▶│   Organization   │────▶│   Feature   │
│   Step 1    │     │  Selection  │     │      Setup       │     │    Tour     │
└─────────────┘     │   Step 2    │     │     Step 3       │     │   Step 4    │
                    │ (IMMUTABLE) │     │  Create/Join Org │     └─────────────┘
                    └─────────────┘     └──────────────────┘
```

### 1.2 Onboarding Strengths
- **Immutable Profile Pattern**: Once role is selected, it cannot be changed (prevents gaming)
- **Capability-Based Access**: Profile type determines feature access via `profile_capabilities`
- **RLS Enforcement**: Row-level security ensures data isolation
- **Progressive Disclosure**: 4-step wizard reduces cognitive load

### 1.3 Critical Onboarding Gaps

#### GAP-O1: Invite Token Validation NOT IMPLEMENTED [SECURITY]
**Location:** `src/services/organizations.service.ts:32-34`
```typescript
// CURRENT (BROKEN)
export async function claimOrgMembership(orgId: string, inviteToken?: string) {
  // inviteToken parameter is IGNORED
  const { data, error } = await client
    .from('org_members')
    .select()
    .eq('organization_id', orgId)  // Only checks org_id, ignores token
}
```
**Risk:** Users can join ANY organization with just the org ID
**Impact:** HIGH - Security vulnerability
**Fix:** Implement invite token validation, create `invites` table

#### GAP-O2: Missing Invites Table
**Issue:** No `invites` table exists in database
**Impact:** No secure invitation workflow
**Required Schema:**
```sql
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT,
  token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'member',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### GAP-O3: Limited Profile Data Collection
**Current Fields:**
- ✓ user_id
- ✓ profile type (buyer/supplier/soe/investor)
- ✓ declared_intent (timestamp + initial_role)
- ✗ Company size/employee count
- ✗ Website/contact info
- ✗ Industry/product categories
- ✗ Uploaded documents (business license, etc.)

**Impact:** Insufficient data for supplier verification, credit assessment, and personalization

#### GAP-O4: No Onboarding Analytics
**Missing Metrics:**
- Step completion rates
- Abandonment points
- Time-to-completion
- Role distribution trends

#### GAP-O5: SOE Validation Missing
**Issue:** Government ID and jurisdiction are optional (should be required for SOE)
**Impact:** SOE verification incomplete

---

## 2. DATA CONNECTIVITY ANALYSIS

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Contexts (5): Auth, Org, Role, Notification, Compare │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Custom Hooks (33+) - React Query based               │  │
│  │ ├─ useQuery + useMutation                            │  │
│  │ ├─ useRealtimeSubscription (postgres_changes)        │  │
│  │ └─ useAuthenticatedClient (JWT injection)            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Service Layer (28+) - RPC-first architecture         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐
    │ Supabase    │  │ Edge Functions   │  │ Third-party  │
    │ PostgreSQL  │  │ (11 deployed)    │  │ APIs         │
    └─────────────┘  └──────────────────┘  └──────────────┘
```

### 2.2 Data Connectivity Strengths
- **React Query**: 60s stale time, automatic cache invalidation
- **RPC-First**: All mutations through Supabase RPCs
- **Realtime**: postgres_changes subscriptions for RFQs, Bids, Deals, Messages
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Edge Functions**: Secure server-side processing (Stripe, Daily.co, Airtable)

### 2.3 Critical Data Connectivity Gaps

#### GAP-D1: Orders RPC NOT IMPLEMENTED [BLOCKING]
**Location:** `src/services/orders.service.ts`
```typescript
// CURRENT (BROKEN)
export async function createOrder(orderData: CreateOrderData) {
  return { data: null, error: new Error('RPC create_order not implemented') }
}

export async function updateOrderStatus(orderId: string, status: string) {
  return { data: null, error: new Error('RPC update_order_status not implemented') }
}
```
**Impact:** CRITICAL - Cannot create or update orders
**Fix:** Implement backend RPC functions

#### GAP-D2: Message Unread Count Uses Polling (30s)
**Current:** `useMessaging().unreadCount` polls every 30 seconds
**Issue:** Delayed notification of new messages
**Fix:** Add realtime subscription for unread count

#### GAP-D3: Auction Updates Not Real-time
**Location:** `src/pages/Auctions.tsx:133`
```typescript
// TODO: Implement WebSocket connections for live bid updates,
// countdown timers, and real-time notifications
```
**Impact:** Poor auction experience, stale bid data

#### GAP-D4: No Offline Strategy
**Issue:** No service worker, no offline cache fallback
**Impact:** App unusable without connectivity

#### GAP-D5: TeleBuy Session Creation RPC Missing
**Location:** `src/components/suppliers/ScheduleTeleBuyModal.tsx:103`
```typescript
// TODO: Implement RPC call to create TeleBuy session
```
**Impact:** Cannot schedule TeleBuy sessions

#### GAP-D6: ElevenLabs Agent Creation Requires Edge Function
**Location:** `src/services/elevenlabs.service.ts`
```typescript
throw new Error('Agent creation requires server-side implementation');
```
**Impact:** Cannot create new AI agents

### 2.4 Cache Configuration Analysis

| Entity | Stale Time | Realtime | Status |
|--------|------------|----------|--------|
| RFQs | 60s | ✓ | Good |
| Bids | 60s | ✓ | Good |
| Deals | 60s | ✓ | Good |
| Organizations | 5min | ✗ | OK |
| Subscriptions | 5min | ✗ | OK |
| Capabilities | 5min | ✗ | OK |
| Messages | 30s polling | Partial | **Needs Fix** |
| Orders | N/A | ✗ | **Broken** |
| Auctions | 60s | ✗ | **Needs Realtime** |

---

## 3. PRODUCT FEATURE STATUS

### 3.1 Feature Completion Matrix

| Feature | Status | Data Ready | Blocking Issues |
|---------|--------|------------|-----------------|
| Dashboard | ✓ Ready | ✓ | None |
| Marketplace | ✓ Ready | ✓ | None |
| RFQs | ✓ Ready | ✓ | None |
| Bids | ✓ Ready | ✓ | None |
| Deals | ✓ Ready | ✓ | None |
| Auctions | ⚠️ Partial | ⚠️ | No real-time |
| Orders | ❌ Blocked | ❌ | RPC not implemented |
| Purchases | ✓ Ready | ✓ | None |
| Messages | ⚠️ Partial | ⚠️ | Polling, not realtime |
| TeleBuy | ⚠️ Partial | ⚠️ | Session RPC missing |
| AI Studio | ⚠️ Partial | ⚠️ | No ML models |
| Analytics | ⚠️ Partial | ⚠️ | Charts not implemented |
| Team | ✓ Ready | ✓ | None |
| Settings | ✓ Ready | ✓ | None |
| Verification | ✓ Ready | ✓ | None |
| Billing | ⚠️ UI Only | N/A | Coming Soon |

### 3.2 Feature Dependencies

```
Authentication (Supabase Auth)
    │
    ▼
Onboarding Profile (immutable)
    │
    ├─── Capabilities (profile_capabilities table)
    │        │
    │        ▼
    │    Feature Access Control
    │
    ▼
Organization Membership
    │
    ├─── Role Assignment (owner/admin/member/viewer)
    │
    ├─── Subscription Tier (free/pro/enterprise)
    │        │
    │        ▼
    │    Gated Features (AI Studio, TeleBuy Privacy)
    │
    └─── View Mode (admin/supplier/buyer)
             │
             ▼
         UI Layout Adaptation
```

### 3.3 Missing Feature Implementations

#### Analytics Page
```typescript
// src/pages/Analytics.tsx - TODOs
- Price charts with Recharts
- Regional price comparison
- Supply/demand indicators
- Supplier distribution map
- Trust scores
- Delivery reliability metrics
```

#### AI Studio
```typescript
// src/pages/AIStudio.tsx - Missing
- Actual ML model integration
- Real price forecast data
- Live risk scoring algorithm
- Supplier matching ML model
```

---

## 4. MVP PRODUCTIVITY RECOMMENDATIONS

### 4.1 Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  QUICK WINS       │  CRITICAL PATH    │
    │  - Realtime msgs  │  - Orders RPC     │
    │  - Analytics UI   │  - Invite tokens  │
    │                   │  - TeleBuy RPC    │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT                  │                   │  EFFORT
    │  BACKLOG          │  STRATEGIC        │
    │  - Offline mode   │  - AI Studio ML   │
    │  - Data export    │  - Auction WS     │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                   LOW IMPACT
```

### 4.2 Immediate Action Items (Sprint 1)

| # | Task | Files | Effort | Impact |
|---|------|-------|--------|--------|
| 1 | Implement `create_order` RPC | `supabase/migrations/`, `orders.service.ts` | 4h | Critical |
| 2 | Implement `update_order_status` RPC | `supabase/migrations/`, `orders.service.ts` | 2h | Critical |
| 3 | Create `invites` table | `supabase/migrations/` | 2h | High |
| 4 | Fix `claimOrgMembership` to validate tokens | `organizations.service.ts` | 2h | High |
| 5 | Add realtime subscription for messages | `useMessaging.ts` | 2h | Medium |
| 6 | Implement TeleBuy session creation RPC | `supabase/migrations/`, `telebuy.service.ts` | 3h | Medium |

### 4.3 Short-term Improvements (Sprint 2)

| # | Task | Impact |
|---|------|--------|
| 7 | Add auction realtime subscriptions | Medium |
| 8 | Implement price charts with Recharts | Medium |
| 9 | Add onboarding analytics tracking | Low |
| 10 | SOE government ID validation | Low |

### 4.4 Strategic Investments (Backlog)

| # | Task | Justification |
|---|------|---------------|
| 11 | Offline-first with service workers | Improves reliability |
| 12 | AI Studio ML model integration | Competitive differentiator |
| 13 | WebSocket for live auction bidding | Essential for auction feature |
| 14 | ElevenLabs Edge Function deployment | Enables AI agents |

---

## 5. DATA FLOW RECOMMENDATIONS

### 5.1 Proposed Realtime Architecture

```
Current State:
┌─────────────────┐
│ postgres_changes│───▶ RFQs, Bids, Deals (working)
└─────────────────┘

Recommended Additions:
┌─────────────────┐
│ postgres_changes│───▶ Messages (unread count)
├─────────────────┤
│ broadcast       │───▶ Auction countdown sync
├─────────────────┤
│ presence        │───▶ TeleBuy participant tracking
└─────────────────┘
```

### 5.2 Cache Optimization Strategy

```typescript
// Recommended cache configuration
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60_000,      // 1 minute default
      gcTime: 300_000,        // 5 minute garbage collection
      retry: 2,               // Increase retry count
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
};

// Entity-specific overrides
const cacheConfig = {
  'messages.unread': { staleTime: 0, refetchInterval: false }, // Realtime only
  'auctions.live': { staleTime: 5_000 },                       // 5s for live auctions
  'subscriptions': { staleTime: 300_000 },                     // 5 min (rare changes)
};
```

---

## 6. RISK ASSESSMENT

### 6.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Orders feature broken at launch | HIGH | CRITICAL | Implement RPC immediately |
| Security breach via invite bypass | MEDIUM | HIGH | Implement token validation |
| Poor UX from stale message data | MEDIUM | MEDIUM | Add realtime subscription |
| Auction bid desync | HIGH | HIGH | Implement WebSocket |

### 6.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User abandonment at onboarding | MEDIUM | HIGH | Add analytics, optimize flow |
| Low engagement due to incomplete features | MEDIUM | MEDIUM | Prioritize core path completion |
| Competitor advantage on AI features | LOW | MEDIUM | Fast-follow on AI Studio |

---

## 7. CONCLUSION

The LithiumBuy platform has a **solid architectural foundation** but requires focused effort on:

1. **Critical Path**: Orders RPC implementation (blocking)
2. **Security**: Invite token validation (vulnerability)
3. **UX**: Realtime messaging and auction updates
4. **Onboarding**: Enhanced data collection and analytics

Addressing these gaps will enable MVP launch readiness within **2 sprints** (~4 weeks).

---

## Appendix A: File Reference Index

### Onboarding
- `/src/pages/Onboarding.tsx` - Main orchestrator
- `/src/components/onboarding/*` - Step components
- `/src/hooks/useUserProfile.ts` - Profile fetching
- `/src/services/organizations.service.ts` - Org operations

### Data Connectivity
- `/src/hooks/useRFQs.ts` - RFQ data
- `/src/hooks/useBids.ts` - Bid data
- `/src/hooks/useDeals.ts` - Deal data
- `/src/hooks/useMessaging.ts` - Messaging
- `/src/hooks/useOrders.ts` - Orders (broken)
- `/src/services/orders.service.ts` - Orders service (stubs)

### Feature Pages
- `/src/pages/Dashboard.tsx`
- `/src/pages/Auctions.tsx`
- `/src/pages/Analytics.tsx`
- `/src/pages/AIStudio.tsx`
- `/src/pages/TeleBuy.tsx`

### Database Migrations
- `/supabase/migrations/20260129052228_*.sql` - Onboarding profiles
- `/supabase/migrations/20260104081028_*.sql` - Profile capabilities

---

*Analysis conducted using systematic codebase exploration across 253 TypeScript files, 28 services, 33+ hooks, and 27 pages.*
