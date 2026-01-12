# LithiumBuy - Complete App Build Prompts

**Generated**: 2025-01-23  
**Current Status**: Phases 1-4 Complete ✅ | Phases 5-7 Remaining  
**Backend**: 100% Complete (52 tables, 24 RPCs verified)  
**Frontend**: 60% Complete  

---

## 📊 Current State Assessment

### ✅ Completed (Phases 1-4)
- ✅ Supabase Auth integration (AuthContext)
- ✅ OrganizationContext with multi-tenant support
- ✅ Onboarding flow (create/join org)
- ✅ Purchases page and service
- ✅ Team management page
- ✅ Protected routes
- ✅ Org switcher
- ✅ All core services exist (organizations, purchases, rfqs, bids, deals, auctions, etc.)

### 🔄 Remaining (Phases 5-7)
- 🔄 **Phase 5**: Multi-Tenant Updates + Real-time (~2 hours)
- 🔄 **Phase 6**: Action Forms (~1.5 hours)  
- 🔄 **Phase 7**: Cleanup + Polish (~30 min)

**Total Remaining**: ~4 hours

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (email/password)
- **State**: React Query + Context API
- **Routing**: React Router v6

### Key Patterns
- **RLS**: All data isolated by `org_id` via Row Level Security
- **RPC Only**: Frontend MUST use RPC functions, NO direct table access
- **Multi-Tenant**: All queries filtered by current organization
- **Real-time**: Supabase subscriptions for live updates

### File Structure
```
src/
├── context/
│   ├── AuthContext.tsx          ✅ Complete
│   ├── OrganizationContext.tsx  ✅ Complete
│   └── NotificationContext.tsx  ⚠️ Needs backend connection
├── services/
│   ├── organizations.service.ts ✅ Complete
│   ├── purchases.service.ts     ✅ Complete
│   ├── rfqs.service.ts          ✅ Complete
│   └── ... (all services exist)
├── hooks/
│   ├── useRFQs.ts               ⚠️ Needs realtime
│   ├── useBids.ts               ⚠️ Needs realtime
│   ├── useDeals.ts              ⚠️ Needs realtime
│   └── ... (most hooks exist)
└── pages/
    ├── Dashboard.tsx            ⚠️ Needs real data
    ├── RFQs.tsx                 ⚠️ Needs create dialog
    ├── Bids.tsx                 ⚠️ Needs award button
    └── ... (all pages exist)
```

---

## 🚀 Phase 5: Multi-Tenant Updates + Real-time

### Prompt 5.1: Create Realtime Subscription Hook

```
Create a reusable hook for Supabase real-time subscriptions in src/hooks/useRealtimeSubscription.ts.

REQUIREMENTS:
1. Hook signature: useRealtimeSubscription(table: string, callback: () => void)
2. Subscribe to postgres_changes events on the specified table
3. Filter by org_id = currentOrg.id (from OrganizationContext)
4. Channel name: `${table}_${currentOrg.id}`
5. Subscribe on mount, unsubscribe on unmount
6. Skip subscription if currentOrg is null
7. Use TypeScript with proper types
8. Import supabase from @/integrations/supabase/client

IMPLEMENTATION:
```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/context/OrganizationContext';

export const useRealtimeSubscription = (
  table: string, 
  callback: () => void
) => {
  const { currentOrg } = useOrganization();
  
  useEffect(() => {
    if (!currentOrg) return;
    
    const channel = supabase
      .channel(`${table}_${currentOrg.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: `org_id=eq.${currentOrg.id}`,
      }, callback)
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [table, currentOrg, callback]);
};
```

Test that it unsubscribes properly when component unmounts.
```

### Prompt 5.2: Update NotificationContext with Backend

```
Update src/context/NotificationContext.tsx to use backend RPCs instead of mock data.

REQUIREMENTS:
1. Import useNotifications hook from @/hooks/useNotifications
2. Replace mock data with real backend data
3. Call get_notifications() on mount (via useNotifications hook)
4. Call mark_notification_read(notificationId) when user clicks/closes notification
5. Add realtime subscription using useRealtimeSubscription('notifications', refetch)
6. Show loading state while fetching
7. Show error toast if fetch fails
8. Maintain existing UI/UX (toast notifications)

STEPS:
1. Import useNotifications from hooks
2. Replace useState with useQuery from useNotifications
3. Add markNotificationRead mutation
4. Add useRealtimeSubscription('notifications', () => queryClient.invalidateQueries(['notifications']))
5. Update toast onClick handler to call markNotificationRead
6. Handle loading and error states

Keep all existing toast styling and behavior - only change the data source.
```

### Prompt 5.3: Add Realtime to All Data Hooks

```
Add real-time subscriptions to all data hooks so UI updates automatically when data changes.

HOOKS TO UPDATE:
1. src/hooks/useRFQs.ts
2. src/hooks/useBids.ts
3. src/hooks/useDeals.ts
4. src/hooks/useAuctions.ts
5. src/hooks/usePurchases.ts

REQUIREMENTS FOR EACH:
1. Import useRealtimeSubscription from @/hooks/useRealtimeSubscription
2. Import useQueryClient from @tanstack/react-query
3. Get queryClient instance
4. Add useRealtimeSubscription(tableName, () => queryClient.invalidateQueries([queryKey]))
5. Table names: 'rfqs', 'bids', 'deals', 'auctions', 'purchases'
6. Query keys should match existing queryKey in useQuery

EXAMPLE PATTERN:
```typescript
export const useRFQs = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['rfqs'],
    queryFn: listRFQs,
  });
  
  useRealtimeSubscription('rfqs', () => {
    queryClient.invalidateQueries(['rfqs']);
  });
  
  return query;
};
```

Apply this pattern to all 5 hooks. Ensure subscriptions only activate when queries are enabled.
```

### Prompt 5.4: Update Dashboard with Real Data

```
Update src/pages/Dashboard.tsx to use real data from hooks instead of mock data.

REQUIREMENTS:
1. Import useRFQs, useDeals, usePurchases hooks
2. Replace all mock data with real hook data
3. Calculate KPIs from real data:
   - Total RFQs: rfqs.length
   - Active Deals: deals.filter(d => d.status === 'active').length
   - Total Purchase Orders: purchases.length
   - Total Value: sum of purchase amounts
4. Show currentOrg.name in header/title
5. Show loading skeletons while data loads
6. Handle empty states (no data)
7. Show error toast if data fetch fails
8. Maintain existing UI/UX and styling

STEPS:
1. Import hooks: useRFQs, useDeals, usePurchases, useOrganization
2. Get currentOrg from useOrganization()
3. Replace mock stats with calculated values from real data
4. Add loading states (use existing Skeleton component)
5. Add error handling
6. Update dashboard title to include org name
7. Test with empty data state
8. Ensure all calculations handle null/undefined gracefully

Keep all existing charts and visualizations - only change data source.
```

---

## 🚀 Phase 6: Action Forms

### Prompt 6.1: Create RFQ Dialog Component

```
Create a dialog component for creating new RFQs in src/components/rfq/CreateRFQDialog.tsx.

REQUIREMENTS:
1. Use shadcn Dialog component
2. Form fields:
   - title (text, required)
   - description (textarea, required)
   - product_id (select/dropdown, optional)
   - target_quantity (number, required)
   - target_unit (select: 'MT', 'KG', 'LB', required)
   - incoterms (text, required)
   - delivery_location (text, required)
3. Use react-hook-form with zod validation
4. Use useCreateRFQ mutation hook
5. Show loading state during submission
6. Show success toast on completion
7. Close dialog on success
8. Reset form on close
9. Use useOrganization to get currentOrg.id (passed to RPC)

FORM VALIDATION (zod schema):
- title: min 3 chars, max 200
- description: min 10 chars
- target_quantity: positive number
- target_unit: enum ['MT', 'KG', 'LB']
- incoterms: min 2 chars
- delivery_location: min 2 chars

STYLING:
- Use existing form components from @/components/ui
- Match existing dialog styling
- Use primary button for submit
- Show field errors inline

After submission, the RFQ should appear in the list immediately via realtime subscription.
```

### Prompt 6.2: Add Create RFQ Button

```
Add a "Create RFQ" button to src/pages/RFQs.tsx that opens the CreateRFQDialog.

REQUIREMENTS:
1. Add button in page header (next to title)
2. Use existing Button component with primary variant
3. Use Dialog from shadcn (controlled open state)
4. Import CreateRFQDialog component
5. Button text: "Create RFQ"
6. Icon: Plus icon from lucide-react
7. Only show for buyers (check currentOrg.org_type === 'buyer')
8. Position: Top right of page header

IMPLEMENTATION:
1. Import CreateRFQDialog
2. Add useState for dialog open state
3. Add button with onClick to set open=true
4. Wrap CreateRFQDialog in Dialog component
5. Pass open and onOpenChange props
6. Dialog should close automatically on successful submission

Test that dialog opens/closes properly and RFQ appears in list after creation.
```

### Prompt 6.3: Create Submit Bid Form Component

```
Create a form component for submitting bids on RFQs in src/components/bid/SubmitBidForm.tsx.

REQUIREMENTS:
1. Form fields:
   - price (number, required)
   - currency (select: 'USD', 'EUR', 'CNY', default: 'USD')
   - quantity (number, required)
   - lead_time_days (number, required, min: 1)
   - notes (textarea, optional)
2. Props: rfqId (uuid, required)
3. Use react-hook-form with zod validation
4. Use useSubmitBid mutation hook
5. Get supplier_org_id from useOrganization (currentOrg.id)
6. Show loading state during submission
7. Show success toast on completion
8. Reset form after submission

FORM VALIDATION (zod):
- price: positive number
- currency: enum ['USD', 'EUR', 'CNY']
- quantity: positive number
- lead_time_days: integer, min 1, max 365
- notes: optional string, max 1000 chars

STYLING:
- Use Card component for container
- Match existing form styling
- Show field errors inline
- Primary button for submit

This form should be displayed on the RFQ detail page for suppliers.
```

### Prompt 6.4: Add Submit Bid to RFQ Detail Page

```
Add submit bid functionality to src/pages/RFQs.tsx for the RFQ detail view.

REQUIREMENTS:
1. Show SubmitBidForm when viewing RFQ detail
2. Only show for suppliers (currentOrg.org_type === 'supplier')
3. Only show if RFQ status is 'submitted' (not closed/cancelled)
4. Pass rfqId prop to SubmitBidForm
5. Position form below RFQ details
6. Add section title: "Submit Bid"

IMPLEMENTATION:
1. Import SubmitBidForm component
2. Import useOrganization to check org_type
3. Check if viewing detail (has rfqId in URL params)
4. Check if supplier org
5. Check if RFQ status allows bidding
6. Render SubmitBidForm conditionally
7. After successful submission, bid should appear in bids list via realtime

Test that form only shows for suppliers and only on active RFQs.
```

### Prompt 6.5: Create Deal Response Buttons Component

```
Create a component for suppliers to accept/reject deals in src/components/deal/DealResponseButtons.tsx.

REQUIREMENTS:
1. Props: dealId (uuid, required)
2. Two buttons: "Accept" and "Reject"
3. Accept button: primary variant, shows confirmation dialog
4. Reject button: destructive variant, opens dialog with note textarea
5. Use useRespondToOffer mutation hook
6. On accept: call respondToOffer(dealId, 'accepted', '')
7. On reject: call respondToOffer(dealId, 'rejected', note)
8. Show loading state during submission
9. Show success toast on completion
10. Disable buttons during submission

CONFIRMATION DIALOG (Accept):
- Use AlertDialog from shadcn
- Title: "Accept Deal?"
- Description: "Are you sure you want to accept this deal?"
- Confirm button: "Accept Deal"
- Cancel button: "Cancel"

REJECT DIALOG:
- Use Dialog from shadcn
- Textarea for rejection note (optional)
- Submit button: "Reject Deal"
- Cancel button

STYLING:
- Buttons side by side with gap
- Match existing button styling
- Use destructive variant for reject

This component should only show for suppliers when deal status is 'pending'.
```

### Prompt 6.6: Add Response Buttons to Deal Detail

```
Add DealResponseButtons to src/pages/Deals.tsx for the deal detail view.

REQUIREMENTS:
1. Import DealResponseButtons component
2. Show when viewing deal detail (has dealId in URL)
3. Only show for suppliers (currentOrg.org_type === 'supplier')
4. Only show when deal.status === 'pending'
5. Position below deal details
6. Add section title: "Respond to Offer"

IMPLEMENTATION:
1. Import DealResponseButtons and useOrganization
2. Check if viewing detail (URL params)
3. Check org_type === 'supplier'
4. Check deal.status === 'pending'
5. Render component conditionally
6. Pass dealId prop

After acceptance/rejection, deal should update via realtime subscription.
```

### Prompt 6.7: Create Award Deal Button Component

```
Create a button component for buyers to award deals to bids in src/components/bid/AwardDealButton.tsx.

REQUIREMENTS:
1. Props: bidId (uuid, required), rfqId (uuid, optional), supplierId (uuid, required)
2. Button text: "Award Deal"
3. Shows confirmation dialog before awarding
4. Use useCreateDeal mutation hook
5. On confirm: call createDeal({ supplier_id, rfq_id, title: "Deal from Bid" })
6. Show loading state during submission
7. Show success toast on completion
8. Disable button during submission

CONFIRMATION DIALOG:
- Use AlertDialog from shadcn
- Title: "Award Deal to Supplier?"
- Description: "This will create a deal offer for the supplier to accept or reject."
- Confirm button: "Award Deal"
- Cancel button: "Cancel"

STYLING:
- Primary button variant
- Icon: Award icon from lucide-react
- Match existing button styling

This button should only show for buyers (currentOrg.org_type === 'buyer').
```

### Prompt 6.8: Add Award Button to Bids List

```
Add AwardDealButton to src/pages/Bids.tsx in the bids list/table.

REQUIREMENTS:
1. Import AwardDealButton component
2. Add button in each bid row/card
3. Only show for buyers (currentOrg.org_type === 'buyer')
4. Only show for bids that haven't been awarded yet (check if bid has deal)
5. Pass bidId, rfqId (if available), supplierId props
6. Position: Actions column or card footer

IMPLEMENTATION:
1. Import AwardDealButton and useOrganization
2. Check org_type === 'buyer'
3. For each bid, check if already has deal (may need to query deals)
4. Render button conditionally
5. Pass required props

After awarding, deal should appear in deals list via realtime, and bid should show as awarded.
```

---

## 🚀 Phase 7: Cleanup & Polish

### Prompt 7.1: Archive Legacy Services

```
Archive unused legacy services to src/services/_legacy/ folder.

SERVICES TO ARCHIVE:
1. src/services/files.service.ts (if not used)
2. src/services/documents.service.ts (if not used)
3. src/services/jobs.service.ts (if not used)
4. src/services/usage.service.ts (if not used)
5. src/services/telebuy.service.ts (KEEP if TeleBuy page uses it)

REQUIREMENTS:
1. Create src/services/_legacy/ directory
2. Move unused services to _legacy folder
3. Update src/services/index.ts to remove archived exports
4. Search codebase for imports of archived services
5. Remove any unused imports
6. Keep telebuy.service.ts if src/pages/TeleBuy.tsx uses it

STEPS:
1. Search for imports of each service file
2. If no imports found, move to _legacy
3. Update index.ts exports
4. Run build to check for broken imports
5. Fix any remaining imports

DO NOT DELETE - only archive. Services may be needed later.
```

### Prompt 7.2: Remove RoleContext

```
Remove RoleContext since it's been replaced by OrganizationContext.

REQUIREMENTS:
1. Delete src/context/RoleContext.tsx
2. Remove RoleProvider from src/App.tsx
3. Search codebase for useRole() imports
4. Replace useRole() with useOrganization() where needed
5. Update any code that uses role/viewMode to use org.org_type instead
6. Remove RoleContext import from App.tsx

FILES TO UPDATE:
1. src/App.tsx - Remove RoleProvider wrapper
2. src/pages/Dashboard.tsx - Replace useRole() with useOrganization()
3. Any other files using useRole()

REPLACEMENT PATTERN:
- useRole().viewMode → useOrganization().currentOrg?.org_type
- 'buyer'/'supplier' role checks → org_type checks

After removal, verify app still builds and runs correctly.
```

### Prompt 7.3: Fix TypeScript Errors

```
Fix all TypeScript errors in the codebase.

REQUIREMENTS:
1. Run: npm run build (or tsc --noEmit)
2. Fix all TypeScript errors
3. Fix all type warnings
4. Ensure strict mode compliance
5. Add proper types for all function parameters
6. Fix any 'any' types (replace with proper types)

COMMON ISSUES TO FIX:
- Missing type annotations
- Incorrect prop types
- Missing null checks
- Incorrect return types
- Unused variables/imports

STEPS:
1. Run type check
2. Fix errors one by one
3. Re-run after each fix
4. Continue until no errors remain
5. Verify build succeeds

Do not disable TypeScript errors - fix them properly.
```

### Prompt 7.4: Test Production Build

```
Test that the production build works correctly.

REQUIREMENTS:
1. Run: npm run build
2. Verify build succeeds with no errors
3. Run: npm run preview
4. Test critical user flows:
   - Login
   - Create organization
   - Create RFQ
   - Submit bid
   - Award deal
   - Accept deal
   - Create purchase order
5. Verify all pages load
6. Verify real-time updates work
7. Check browser console for errors
8. Test on different screen sizes

CRITICAL FLOWS:
1. Auth → Onboarding → Dashboard
2. Create RFQ → View RFQ → Submit Bid (as supplier)
3. View Bid → Award Deal (as buyer)
4. View Deal → Accept Deal (as supplier)
5. Create Purchase Order
6. Switch Organizations

FIX ANY ISSUES FOUND:
- Build errors
- Runtime errors
- Missing functionality
- UI/UX issues

After testing, document any known issues or limitations.
```

---

## 🎯 Complete App Completion Prompt

```
Complete the LithiumBuy MVP by implementing Phases 5-7.

CONTEXT:
- Backend: 100% complete (52 tables, 24 RPCs verified)
- Frontend: Phases 1-4 complete (Auth, Orgs, Purchases, Team)
- Remaining: Phases 5-7 (Real-time, Action Forms, Cleanup)

PHASE 5: Multi-Tenant Updates + Real-time (~2 hours)
1. Create useRealtimeSubscription hook
2. Update NotificationContext with backend
3. Add realtime to all data hooks (RFQs, Bids, Deals, Auctions, Purchases)
4. Update Dashboard with real data

PHASE 6: Action Forms (~1.5 hours)
1. Create CreateRFQDialog component
2. Add Create RFQ button to RFQs page
3. Create SubmitBidForm component
4. Add Submit Bid to RFQ detail
5. Create DealResponseButtons component
6. Add Response buttons to Deal detail
7. Create AwardDealButton component
8. Add Award button to Bids list

PHASE 7: Cleanup & Polish (~30 min)
1. Archive legacy services
2. Remove RoleContext
3. Fix TypeScript errors
4. Test production build

REQUIREMENTS:
- All code must use TypeScript with proper types
- All forms must use react-hook-form + zod validation
- All mutations must show loading states and success toasts
- All real-time updates must work via Supabase subscriptions
- All RPC calls must use authenticated client
- All data must be filtered by currentOrg.id
- Match existing UI/UX and styling
- No direct table access - only RPC functions
- Handle loading, error, and empty states

DEFINITION OF DONE:
✅ All Phase 5 tasks complete
✅ All Phase 6 tasks complete
✅ All Phase 7 tasks complete
✅ No TypeScript errors
✅ Production build succeeds
✅ All critical flows tested
✅ Real-time updates working
✅ All forms validated and functional

Start with Phase 5, then Phase 6, then Phase 7. Complete each phase fully before moving to the next.
```

---

## 📚 Reference Documents

- **API Reference**: `SKILLS.md` - All RPC functions and signatures
- **Complete Plan**: `MVP_COMPLETE_PLAN.md` - Detailed phase breakdown
- **Status**: `MVP_STATUS.md` - Current progress tracker
- **Backend Verification**: `BACKEND_VERIFICATION.md` - Database schema verified
- **Auth Setup**: See `src/context/AuthContext.tsx` for Supabase Auth pattern

---

## 🧪 Testing Checklist

After completion, verify:

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
- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All forms validate correctly
- [ ] All mutations show success toasts
- [ ] Loading states work correctly
- [ ] Error handling works (try invalid data)

---

**Ready to complete the MVP!** 🚀
