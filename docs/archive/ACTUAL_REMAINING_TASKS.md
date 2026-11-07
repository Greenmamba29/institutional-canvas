# LithiumBuy - Actual Remaining Tasks

**Generated**: 2025-01-23  
**Status**: Most components exist! Need to verify and wire up remaining pieces.

---

## ✅ Already Complete

### Components ✅
- ✅ `CreateRFQDialog` - EXISTS in `src/components/rfq/CreateRFQDialog.tsx`
- ✅ `SubmitBidForm` - EXISTS in `src/components/bid/SubmitBidForm.tsx`
- ✅ `DealResponseButtons` - EXISTS in `src/components/deal/DealResponseButtons.tsx`
- ✅ `AwardDealButton` - EXISTS in `src/components/bid/AwardDealButton.tsx`
- ✅ `useRealtimeSubscription` - EXISTS and in use
- ✅ All services exist (organizations, purchases, rfqs, bids, deals, etc.)
- ✅ Auth + OrganizationContext complete
- ✅ Onboarding + Purchases pages exist

---

## 🔍 Verification Tasks

### Task 1: Verify Action Forms Are Wired Up

**Check if these components are actually used in pages:**

1. **CreateRFQDialog** - Check `src/pages/RFQs.tsx`
   - Is CreateRFQDialog imported and rendered?
   - Does it have a trigger button?
   - ✅ FOUND: Already imported and used in RFQs.tsx

2. **SubmitBidForm** - Check `src/pages/RFQs.tsx` (detail view)
   - Is SubmitBidForm imported?
   - Is it shown on RFQ detail page?
   - Only for suppliers?

3. **DealResponseButtons** - Check `src/pages/Deals.tsx`
   - Is DealResponseButtons imported?
   - Is it shown on Deal detail page?
   - Only for suppliers when status='pending'?

4. **AwardDealButton** - Check `src/pages/Bids.tsx`
   - Is AwardDealButton imported?
   - Is it shown in bids list/table?
   - Only for buyers?

**Prompt:**
```
Verify that all action form components are properly wired up in their respective pages.

CHECK:
1. CreateRFQDialog - src/pages/RFQs.tsx - Should be imported and have trigger button ✅ DONE
2. SubmitBidForm - src/pages/RFQs.tsx - Should show on RFQ detail for suppliers
3. DealResponseButtons - src/pages/Deals.tsx - Should show on Deal detail for suppliers
4. AwardDealButton - src/pages/Bids.tsx - Should show in bids list for buyers

For each missing integration:
- Import the component
- Add conditional rendering (check org_type)
- Pass required props
- Position appropriately in UI
```

---

## 🔄 Actually Remaining Tasks

### Task 2: Update NotificationContext to Use Backend

**Current State**: Uses mock data  
**File**: `src/context/NotificationContext.tsx`

**Requirements:**
1. Import `useNotifications` hook from `@/hooks/useNotifications` (if exists)
2. OR create the hook if missing
3. Replace mock data with real backend data
4. Call `get_notifications()` RPC on mount
5. Call `mark_notification_read()` when user clicks notification
6. Add realtime subscription using `useRealtimeSubscription`

**Prompt:**
```
Update src/context/NotificationContext.tsx to use backend RPCs instead of mock data.

STEPS:
1. Check if useNotifications hook exists in src/hooks/useNotifications.ts
2. If missing, create hook that calls get_notifications() RPC
3. Update NotificationContext to use useNotifications hook
4. Replace initialNotifications mock data with useQuery result
5. Update markAsRead to call mark_notification_read() RPC
6. Add useRealtimeSubscription('notifications', refetch) for live updates
7. Handle loading and error states
8. Maintain existing UI/UX (toast notifications)

REQUIREMENTS:
- Use React Query for data fetching
- Show loading state while fetching
- Show error toast if fetch fails
- Maintain existing notification interface
- Real-time updates should work automatically
```

---

### Task 3: Update Dashboard with Real Data

**Current State**: May use mock data  
**File**: `src/pages/Dashboard.tsx`

**Requirements:**
1. Import `useRFQs`, `useDeals`, `usePurchases` hooks
2. Replace mock stats with calculated values from real data
3. Show `currentOrg.name` in header/title
4. Handle loading states (use Skeleton component)
5. Handle empty states (no data)
6. Calculate KPIs from real data

**Prompt:**
```
Update src/pages/Dashboard.tsx to use real data from hooks instead of mock data.

STEPS:
1. Import useRFQs, useDeals, usePurchases, useOrganization hooks
2. Get data from hooks: const { data: rfqs } = useRFQs(), etc.
3. Calculate KPIs from real data:
   - Total RFQs: rfqs?.length ?? 0
   - Active Deals: deals?.filter(d => d.status === 'active').length ?? 0
   - Total Purchase Orders: purchases?.length ?? 0
   - Total Value: sum of purchase amounts
4. Get currentOrg from useOrganization()
5. Show currentOrg.name in dashboard title/header
6. Add loading skeletons while data loads
7. Handle empty states (show "No data" messages)
8. Handle error states (show error toast)

REQUIREMENTS:
- All calculations must handle null/undefined gracefully
- Use existing Skeleton component for loading
- Maintain existing UI/UX and styling
- Keep all existing charts and visualizations
- Only change data source, not UI structure
```

---

### Task 4: Add Realtime to usePurchases Hook

**Current State**: May not have realtime subscription  
**File**: `src/hooks/usePurchases.ts`

**Check**: Does usePurchases have realtime subscription?

**Prompt (if missing):**
```
Add realtime subscription to src/hooks/usePurchases.ts.

STEPS:
1. Import useRealtimeSubscription from @/hooks/useRealtimeSubscription
2. Import useQueryClient from @tanstack/react-query
3. Get queryClient instance
4. Add useRealtimeSubscription with:
   - table: 'purchases'
   - event: '*'
   - filter: org_id filter (if needed)
   - queryKey: ['purchases', currentOrgId]
   - enabled: when query is enabled

EXAMPLE:
```typescript
const queryClient = useQueryClient();
useRealtimeSubscription({
  table: 'purchases',
  event: '*',
  queryKey: ['purchases', currentOrgId],
  enabled: !!currentOrgId,
});
```

This ensures purchases list updates in real-time when data changes.
```

---

### Task 5: Verify SubmitBidForm is Used in RFQ Detail

**Check**: Is SubmitBidForm shown on RFQ detail page?

**File to check**: `src/pages/RFQs.tsx`

**Prompt (if missing):**
```
Add SubmitBidForm to RFQ detail view in src/pages/RFQs.tsx.

REQUIREMENTS:
1. Import SubmitBidForm component
2. Import useOrganization to check org_type
3. Show form when viewing RFQ detail (has rfqId in URL params)
4. Only show for suppliers (currentOrg.org_type === 'supplier')
5. Only show if RFQ status allows bidding (status === 'submitted')
6. Pass rfqId and supplierId (currentOrg.id) props
7. Position below RFQ details section

STEPS:
1. Check if viewing detail view (useParams for rfqId)
2. Get currentOrg from useOrganization()
3. Get RFQ data to check status
4. Conditionally render SubmitBidForm
5. Pass required props: rfqId, supplierId

After submission, bid should appear in bids list via realtime.
```

---

### Task 6: Verify DealResponseButtons is Used in Deal Detail

**Check**: Is DealResponseButtons shown on Deal detail page?

**File to check**: `src/pages/Deals.tsx`

**Prompt (if missing):**
```
Add DealResponseButtons to Deal detail view in src/pages/Deals.tsx.

REQUIREMENTS:
1. Import DealResponseButtons component
2. Import useOrganization to check org_type
3. Show when viewing Deal detail (has dealId in URL params)
4. Only show for suppliers (currentOrg.org_type === 'supplier')
5. Only show when deal.status === 'pending'
6. Pass dealId prop
7. Position below deal details

STEPS:
1. Check if viewing detail view (useParams for dealId)
2. Get currentOrg from useOrganization()
3. Get Deal data to check status
4. Conditionally render DealResponseButtons
5. Pass dealId prop

After acceptance/rejection, deal should update via realtime.
```

---

### Task 7: Verify AwardDealButton is Used in Bids List

**Check**: Is AwardDealButton shown in bids list?

**File to check**: `src/pages/Bids.tsx`

**Prompt (if missing):**
```
Add AwardDealButton to bids list in src/pages/Bids.tsx.

REQUIREMENTS:
1. Import AwardDealButton component
2. Import useOrganization to check org_type
3. Show button in each bid row/card
4. Only show for buyers (currentOrg.org_type === 'buyer')
5. Only show for bids that haven't been awarded yet
6. Pass required props: bidId, supplierId, rfqId (if available)
7. Position in Actions column or card footer

STEPS:
1. Get currentOrg from useOrganization()
2. Check org_type === 'buyer'
3. For each bid, check if already has deal (may need to query deals)
4. Conditionally render AwardDealButton
5. Pass required props

After awarding, deal should appear in deals list via realtime.
```

---

### Task 8: Remove RoleContext (if still used)

**Check**: Is RoleContext still imported/used anywhere?

**Files to check**: 
- `src/App.tsx` - Remove RoleProvider
- `src/pages/Dashboard.tsx` - Replace useRole() with useOrganization()
- Search codebase for `useRole` imports

**Prompt:**
```
Remove RoleContext since it's been replaced by OrganizationContext.

STEPS:
1. Search codebase for "useRole" or "RoleContext" imports
2. Replace useRole() with useOrganization()
3. Replace role/viewMode checks with currentOrg.org_type checks
4. Remove RoleProvider from src/App.tsx
5. Delete src/context/RoleContext.tsx
6. Run build to check for errors

REPLACEMENT PATTERN:
- useRole().viewMode → useOrganization().currentOrg?.org_type
- viewMode === 'buyer' → org_type === 'buyer'
- viewMode === 'supplier' → org_type === 'supplier'

After removal, verify app still builds and runs correctly.
```

---

### Task 9: Test Everything

**Prompt:**
```
Test all critical user flows to ensure everything works end-to-end.

CRITICAL FLOWS:
1. Login → Onboarding → Dashboard
2. Create RFQ → View RFQ → Submit Bid (as supplier)
3. View Bid → Award Deal (as buyer)
4. View Deal → Accept Deal (as supplier)
5. Create Purchase Order
6. Switch Organizations
7. Real-time updates (open 2 tabs, create in one, see in other)

CHECKLIST:
- [ ] Login/logout works
- [ ] Create organization works
- [ ] Switch organizations works
- [ ] Create RFQ → appears in list immediately
- [ ] Submit bid → appears in bids list immediately
- [ ] Award deal → deal created and appears in deals list
- [ ] Accept deal → deal status updates immediately
- [ ] Create purchase order → appears in purchases list
- [ ] Real-time updates work (open in 2 tabs, create in one, see in other)
- [ ] All pages load without errors
- [ ] Production build succeeds: npm run build
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All forms validate correctly
- [ ] All mutations show success toasts
- [ ] Loading states work correctly
- [ ] Error handling works

FIX ANY ISSUES FOUND.
```

---

## 🎯 Quick Completion Prompt

```
Complete the remaining tasks for LithiumBuy MVP:

VERIFY (Task 1):
1. Check if SubmitBidForm is used in RFQ detail page
2. Check if DealResponseButtons is used in Deal detail page  
3. Check if AwardDealButton is used in Bids list
4. Wire up any missing integrations

UPDATE (Tasks 2-3):
1. Update NotificationContext to use backend RPCs (replace mock data)
2. Update Dashboard to use real data from hooks

ADD (Task 4):
1. Add realtime subscription to usePurchases hook (if missing)

CLEANUP (Task 8):
1. Remove RoleContext if still used

TEST (Task 9):
1. Test all critical user flows
2. Fix any issues found
3. Verify production build succeeds

Most components already exist - just need to verify they're wired up correctly and update data sources from mock to real backend.
```

---

## 📚 Reference

- **Components**: Already exist in `src/components/`
- **Services**: All services exist in `src/services/`
- **Hooks**: Most hooks exist, some may need realtime subscriptions
- **Backend**: 100% complete (all RPCs verified)
- **API Reference**: See `SKILLS.md` for RPC function signatures

---

**Estimated Time**: 1-2 hours (mostly verification and wiring up existing components)
