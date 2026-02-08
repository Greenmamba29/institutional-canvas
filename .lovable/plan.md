
# MVP Completion Plan: TeleBuy, Chain of Custody & Nuanced Features

## Current State Assessment

Based on autonomous browsing and codebase analysis, I've identified the following issues and gaps:

### Components Working
- Dashboard loads with KPIs, GMV charts, and audit log
- Marketplace displays listings with search/filter functionality
- RFQs page with CRUD operations via skills
- Deals page displays cards with status badges
- TeleBuy page shows session list with scheduling dialog
- Auctions page displays live/scheduled/ended sections

### Critical Issues Identified

| Issue | Location | Root Cause |
|-------|----------|------------|
| **TeleBuy VideoCallRoom not accessible** | Session cards → Join button | No route handler for active session view |
| **Chain of Custody is just a button** | AuditLog.tsx line 71 | No dedicated page or component |
| **SkillRecommendations not integrated** | Created but never imported | Missing from Dashboard/layout |
| **Skill-backed actions not wired to UI** | useTelebuySkill, useRfqSkill, useAuctionSkill | Hooks exist but legacy hooks still used |
| **Orders RPC not implemented** | orders.service.ts | Backend stub returns error |
| **Daily.co requires room creation** | VideoCallRoom.tsx | Hardcoded meeting URLs fail |

---

## Implementation Plan

### Epic 1: Wire TeleBuy VideoCallRoom to Active Sessions
**Priority: P0 - Core Feature**

#### 1.1 Create TeleBuy Session Detail Route
- Add `/telebuy/session/:id` route handler in `TeleBuy.tsx`
- When user clicks "Join Session", navigate to session view instead of just opening URL
- For Daily.co sessions: render `VideoCallRoom` component
- For Google Meet: open in new tab

#### 1.2 Fix Video Room Creation Flow
- Wire `CreateTelebuySessionDialog` to use skill-based `useTelebuyStartSession` hook
- Add demo mode support (creates mock session without video provider)
- Integrate with `daily-rooms` Edge Function for real room creation

#### 1.3 Add Session Participant Tracking
- Track who joined the session
- Display participant list in VideoCallRoom sidebar
- Save participant join/leave events to audit log

**Files to modify:**
- `src/pages/TeleBuy.tsx` - Add session detail view
- `src/components/telebuy/CreateTelebuySessionDialog.tsx` - Wire to skills
- `src/components/telebuy/SessionCard.tsx` - Fix join flow

---

### Epic 2: Implement Chain of Custody Page
**Priority: P0 - Critical MVP Feature**

Chain of Custody is essential for B2B lithium trading - it tracks material provenance from mine to buyer.

#### 2.1 Create ChainOfCustody Page
New page at `/chain-of-custody` with:
- Timeline visualization of material journey
- Event cards for each custody transfer
- Document attachments per event
- Verification badges for each step

#### 2.2 Chain of Custody Data Model
Create dedicated types and service:
```typescript
interface CustodyEvent {
  id: string;
  orderId: string;
  eventType: 'origin' | 'extraction' | 'processing' | 'transport' | 'storage' | 'delivery';
  location: string;
  timestamp: string;
  verifiedBy?: string;
  documents: string[];
  coordinates?: { lat: number; lng: number };
}
```

#### 2.3 Wire AuditLog Button
- Change "VIEW FULL CHAIN OF CUSTODY" button to navigate to `/chain-of-custody`
- Pass context (orderId, dealId) to pre-filter the view

**Files to create:**
- `src/pages/ChainOfCustody.tsx` - Main page
- `src/components/chain-of-custody/CustodyTimeline.tsx` - Visual timeline
- `src/components/chain-of-custody/CustodyEventCard.tsx` - Individual events
- `src/hooks/useCustodyEvents.ts` - Data hook
- `src/services/custody.service.ts` - Service layer

**Files to modify:**
- `src/App.tsx` - Add route
- `src/components/dashboard/AuditLog.tsx` - Wire button navigation

---

### Epic 3: Integrate Skills into UI Components
**Priority: P1 - Architecture Completion**

The skill hooks were created but legacy hooks are still used. This epic wires them properly.

#### 3.1 Replace Legacy Hooks with Skill Hooks

| Page | Current Hook | Replace With |
|------|--------------|--------------|
| TeleBuy | `useCreateTelebuySession` | `useTelebuyStartSession` |
| RFQs | `useRFQs` | Keep for reads, add `useRfqCreate` for mutations |
| Auctions | `useAuctions` | Keep for reads, add `useAuctionBid` for bids |

#### 3.2 Add SkillRecommendations to Dashboard
- Import and render `SkillRecommendations` component in Dashboard sidebar
- Position below MetricsReview or AuditLog
- Use compact mode on mobile

#### 3.3 Add Skill Actions to Detail Pages
- Add `SkillActionButton` to supplier detail page (for TeleBuy start)
- Add skill actions to deal detail view
- Add quick action buttons to RFQ cards

**Files to modify:**
- `src/pages/Dashboard.tsx` - Add SkillRecommendations
- `src/pages/TeleBuy.tsx` - Use skill hooks
- `src/components/rfq/CreateRFQDialog.tsx` - Use skill hook
- `src/components/suppliers/ScheduleTeleBuyModal.tsx` - Wire to skill

---

### Epic 4: Fix Missing RPC Implementations
**Priority: P0 - Blocking**

Several RPCs are stubbed on the frontend but missing backend implementation.

#### 4.1 Orders RPC
The `create_order` and `update_order_status` RPCs are referenced but not implemented.

**Required Database Migration:**
```sql
CREATE OR REPLACE FUNCTION public.create_order(
  p_supplier_id UUID,
  p_buyer_org_id UUID,
  p_deal_id UUID,
  p_total_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
BEGIN
  -- Kill switch check
  IF is_system_read_only() THEN
    RAISE EXCEPTION 'System is in read-only mode';
  END IF;

  INSERT INTO orders (supplier_id, buyer_org_id, deal_id, total_amount, currency, status)
  VALUES (p_supplier_id, p_buyer_org_id, p_deal_id, p_total_amount, p_currency, 'pending')
  RETURNING * INTO v_order;

  -- Log to domain_events
  INSERT INTO domain_events (event_type, payload, org_id)
  VALUES ('order.created', jsonb_build_object('order_id', v_order.id), p_buyer_org_id);

  RETURN v_order;
END;
$$;
```

#### 4.2 Invite Token System
Create invites table and validation RPC as outlined in GAP_ANALYSIS_MVP_PRODUCTIVITY.md

**Files to create:**
- Migration for `create_order` RPC
- Migration for `update_order_status` RPC
- Migration for `invites` table and validation

---

### Epic 5: Real-time Features Completion
**Priority: P1 - UX Enhancement**

#### 5.1 Auction Real-time Updates
- Add Supabase realtime subscription to auctions page
- Update bid counts and current price in real-time
- Add countdown timer sync via broadcast channel

#### 5.2 Message Unread Badge Real-time
- Replace 30s polling with realtime subscription
- Update notification dropdown instantly

#### 5.3 TeleBuy Session Status Updates
- Already has realtime subscription (confirmed in useTelebuy.ts)
- Ensure it updates when session status changes (in_progress, completed)

**Files to modify:**
- `src/hooks/useAuctions.ts` - Add realtime subscription
- `src/hooks/useNotifications.ts` - Replace polling
- `src/pages/Auctions.tsx` - Wire live bid updates

---

### Epic 6: Polish & Edge Cases
**Priority: P2 - MVP Polish**

#### 6.1 Empty States Enhancement
- Add call-to-action buttons to all empty states
- Include onboarding hints for new users

#### 6.2 Error Boundary per Page
- Wrap each page in granular error boundary
- Add "retry" functionality to failed data loads

#### 6.3 Mobile Responsiveness Audit
- Verify all pages work on 375px viewport
- Fix TeleBuy layout for mobile
- Ensure Chain of Custody timeline is scrollable

#### 6.4 Accessibility Pass
- Verify keyboard navigation on all interactive elements
- Add aria-labels to icon-only buttons
- Ensure color contrast meets WCAG 2.1 AA

---

## Implementation Sequence

```text
Week 1 (Critical Path):
├── Epic 1: TeleBuy VideoCallRoom (2 days)
├── Epic 2: Chain of Custody Page (2 days)
└── Epic 4: Orders RPC (1 day)

Week 2 (Integration):
├── Epic 3: Skills Integration (2 days)
├── Epic 5: Real-time Features (2 days)
└── Epic 6: Polish (1 day)
```

---

## Technical Decisions

### TeleBuy Session Flow
```text
                                  ┌────────────────────┐
                                  │ CreateSessionDialog│
                                  └─────────┬──────────┘
                                            │ useTelebuyStartSession()
                                            ▼
                               ┌────────────────────────┐
                               │ telebuy-guard (7 checks)│
                               └─────────┬──────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
    ┌────▼─────┐                  ┌──────▼──────┐                ┌───────▼───────┐
    │ Demo Mode│                  │  Daily.co   │                │ Google Meet   │
    │ Mock URL │                  │ Edge Func   │                │ Calendar API  │
    └────┬─────┘                  └──────┬──────┘                └───────┬───────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                               ┌─────────▼─────────┐
                               │ create_telebuy_   │
                               │ session RPC       │
                               └─────────┬─────────┘
                                         │
                               ┌─────────▼─────────┐
                               │ Session Created   │
                               │ Navigate to view  │
                               └───────────────────┘
```

### Chain of Custody Data Model
```text
Order/Deal
    │
    └── CustodyEvent[]
            ├── origin (mine/recycler info)
            ├── extraction (processing records)
            ├── transport (shipping documents)
            ├── storage (warehouse receipts)
            └── delivery (final confirmation)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/ChainOfCustody.tsx` | Main CoC page |
| `src/components/chain-of-custody/CustodyTimeline.tsx` | Visual timeline |
| `src/components/chain-of-custody/CustodyEventCard.tsx` | Event cards |
| `src/components/chain-of-custody/CustodyMap.tsx` | Optional map view |
| `src/hooks/useCustodyEvents.ts` | Data fetching |
| `src/services/custody.service.ts` | Service layer |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/chain-of-custody` route |
| `src/pages/TeleBuy.tsx` | Add session detail view, wire skills |
| `src/pages/Dashboard.tsx` | Add SkillRecommendations component |
| `src/components/dashboard/AuditLog.tsx` | Wire CoC button to navigation |
| `src/components/telebuy/CreateTelebuySessionDialog.tsx` | Use skill hook |
| `src/components/telebuy/SessionCard.tsx` | Fix join session navigation |
| `src/hooks/useAuctions.ts` | Add realtime subscription |

---

## Definition of Done

For MVP completion:
- [ ] TeleBuy sessions can be scheduled and joined with video
- [ ] Chain of Custody page displays material provenance timeline
- [ ] All 8 skills are wired to UI components
- [ ] SkillRecommendations appear on Dashboard
- [ ] Orders can be created from ConfirmPurchaseFlow
- [ ] Auctions show real-time bid updates
- [ ] All pages pass mobile viewport test (375px)
- [ ] E2E tests cover critical flows
