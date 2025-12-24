# Lithium Buy MVP - Divide & Conquer Implementation Plan

**Status**: ✅ Database verified - All 52 tables + 15 core RPCs ready  
**Goal**: Ship working MVP in parallel workstreams  
**Strategy**: Backend-first, then Frontend in 2 parallel tracks

---

## 🎯 Critical Path (Sequential - Must Complete First)

### Stream 0: Backend Finalization (Warp) - 30 min
**Owner**: Warp Agent  
**Blocker**: Frontend depends on these

#### Tasks:
1. ✅ Verify all RPC functions exist (DONE)
2. Update SKILLS.md with new organizations/purchases RPCs
3. Regenerate TypeScript types (already done)
4. Create sample seed data for testing:
   - 2 organizations (1 buyer, 1 supplier)
   - 2 org_members (1 per org)
   - 3 RFQs
   - 5 bids
   - 2 deals
   - 1 purchase
5. Test RPCs manually via SQL to verify auth flow works

**Deliverable**: Seed data script + verified RPC calls

---

## 🔀 Parallel Workstreams (After Stream 0)

### Stream 1: Core Auth & Infrastructure (Lovable) - 1 hour
**Owner**: Lovable Agent  
**Priority**: CRITICAL - Blocks all other frontend work

#### Tasks:
1. Install `@auth0/auth0-react`
2. Create `src/context/AuthContext.tsx`:
   - Auth0Provider wrapper
   - useAuth hook
   - Export user, org_id, isAuthenticated, isLoading, loginWithRedirect, logout
3. Create `src/lib/supabase/authenticated-client.ts`:
   ```typescript
   export const createAuthenticatedClient = (token: string) => {
     return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
       global: { headers: { Authorization: `Bearer ${token}` } }
     });
   };
   ```
4. Update `src/lib/supabase/rpc.ts`:
   - Use authenticated client instead of base client
   - Inject token from useAuth hook
5. Wrap App.tsx with AuthProvider
6. Add login/logout to TopNav

**Deliverable**: Auth working, RLS enforced, tokens injected

---

### Stream 2A: Real-time Foundation (Lovable) - 45 min
**Owner**: Lovable Agent  
**Depends on**: Stream 1 complete  
**Runs parallel with**: Stream 2B

#### Tasks:
1. Create `src/hooks/useRealtimeSubscription.ts`:
   ```typescript
   useRealtimeSubscription(
     table: string,
     callback: () => void,
     filter?: { column: string, value: any }
   )
   ```
2. Update NotificationContext:
   - Replace local state with `get_notifications()` RPC
   - Call `mark_notification_read()` on mark
   - Add realtime subscription for INSERT events
3. Add realtime to data hooks:
   - Update `useRFQs` - invalidate on rfqs changes
   - Update `useAuctions` - invalidate on auctions changes
   - Update `useDeals` - invalidate on deals changes
   - Update `useBids` - invalidate on bids changes

**Deliverable**: Live updates working across all pages

---

### Stream 2B: Action Forms & Interactions (Lovable) - 1.5 hours
**Owner**: Lovable Agent  
**Depends on**: Stream 1 complete  
**Runs parallel with**: Stream 2A

#### Tasks:
1. Create `src/components/rfq/CreateRFQDialog.tsx`:
   - Form: title, description, product, quantity, unit, incoterms, location
   - Use `useCreateRFQ()` mutation from hooks
   - Validation with react-hook-form + zod
   - Toast on success/error
2. Create `src/components/bid/SubmitBidForm.tsx`:
   - Form: price, currency, quantity, lead_time_days, notes
   - Use `useSubmitBid()` mutation
   - Show on RFQ detail page for suppliers
3. Create `src/components/deal/DealResponseButtons.tsx`:
   - Accept/Reject buttons
   - Note textarea on reject
   - Use `useRespondToOffer()` mutation
   - Show on Deal detail page for suppliers
4. Create `src/components/bid/AwardDealButton.tsx`:
   - Award button for buyers
   - Confirmation dialog
   - Use `useCreateDeal()` mutation
   - Show on Bid card/detail
5. Add "+ Create RFQ" button to RFQs page (opens dialog)
6. Add "Submit Bid" button to RFQ detail page (for suppliers)

**Deliverable**: All CRUD flows working end-to-end

---

### Stream 3: Dashboard & Analytics (Lovable) - 1 hour
**Owner**: Lovable Agent  
**Depends on**: Stream 1 + 2B complete

#### Tasks:
1. Create `src/hooks/useDashboardStats.ts`:
   - Aggregate from `list_rfqs()`, `list_deals()`, etc
   - OR create backend `get_dashboard_stats()` RPC (faster)
   - Return: { activeRFQs, openBids, activeDeals, totalSpend }
2. Update Dashboard.tsx:
   - Replace mock data with `useDashboardStats()`
   - Add real-time price ticker via `get_price_indicators()`
   - Show user's organizations via `get_my_organizations()`
3. Create `src/components/dashboard/RecentActivity.tsx`:
   - Show last 10 notifications
   - Link to relevant entities

**Deliverable**: Dashboard shows real data

---

### Stream 4: Organizations & Purchases (Lovable) - 1 hour
**Owner**: Lovable Agent  
**Depends on**: Stream 1 complete  
**Can run parallel with**: Stream 2A/2B

#### Tasks:
1. Create `src/services/organizations.service.ts`:
   ```typescript
   createOrganization(params)
   getMyOrganizations()
   inviteOrgMember(orgId, email, role)
   getOrgMembers(orgId)
   ```
2. Create `src/services/purchases.service.ts`:
   ```typescript
   createPurchase(params)
   listPurchases()
   getPurchase(purchaseId)
   updatePurchaseStatus(purchaseId, status)
   ```
3. Create `src/hooks/useOrganizations.ts` (React Query)
4. Create `src/hooks/usePurchases.ts` (React Query)
5. Create `src/pages/Purchases.tsx`:
   - List all purchases
   - Show PO numbers, status, buyer, supplier
   - Filter by status
6. Create `src/components/purchase/CreatePurchaseDialog.tsx`
7. Add Purchases to navigation

**Deliverable**: Purchase order management working

---

### Stream 5: Polish & Cleanup (Lovable) - 30 min
**Owner**: Lovable Agent  
**Depends on**: All streams above complete

#### Tasks:
1. Archive legacy services:
   - Move to `src/services/_legacy/`:
     - files.service.ts
     - documents.service.ts
     - jobs.service.ts
     - usage.service.ts
     - telebuy.service.ts
2. Update `src/services/index.ts` to only export Lithium Buy services
3. Remove unused imports
4. Fix TypeScript errors
5. Test build: `npm run build`
6. Visual QA pass on all pages

**Deliverable**: Clean, buildable codebase

---

## 📊 Timeline Estimate

| Stream | Duration | Dependencies | Can Parallelize? |
|--------|----------|--------------|------------------|
| 0: Backend | 30 min | None | No |
| 1: Auth | 1 hour | Stream 0 | No |
| 2A: Realtime | 45 min | Stream 1 | Yes (with 2B, 4) |
| 2B: Forms | 1.5 hours | Stream 1 | Yes (with 2A, 4) |
| 3: Dashboard | 1 hour | Streams 1, 2B | No |
| 4: Orgs/Purchases | 1 hour | Stream 1 | Yes (with 2A, 2B) |
| 5: Cleanup | 30 min | All above | No |

**Sequential Total**: ~5.5 hours  
**With Parallelization**: ~3-4 hours  

---

## 🚀 Execution Plan

### Phase 1: Foundation (Sequential)
```
Warp:    [Stream 0: 30min] → Push seed data + verification
Lovable: Wait for Warp → [Stream 1: 1hr] → Auth working
```

### Phase 2: Parallel Build (Concurrent)
```
Lovable Track A: [Stream 2A: 45min - Realtime] ──┐
Lovable Track B: [Stream 2B: 1.5hr - Forms]    ──┼→ Merge
Lovable Track C: [Stream 4: 1hr - Orgs/POs]    ──┘
```

### Phase 3: Integration (Sequential)
```
Lovable: [Stream 3: 1hr - Dashboard] → Use data from 2A/2B/4
```

### Phase 4: Ship (Sequential)
```
Lovable: [Stream 5: 30min - Cleanup] → Build → Deploy
```

---

## ✅ Definition of Done

### Backend (Warp)
- [ ] All RPC functions tested manually
- [ ] Seed data in database
- [ ] SKILLS.md updated with organizations/purchases patterns
- [ ] No SQL errors in migrations

### Frontend (Lovable)
- [ ] Auth0 login/logout works
- [ ] JWT injected into Supabase for RLS
- [ ] Can create RFQ as buyer
- [ ] Can submit bid as supplier
- [ ] Can award deal as buyer
- [ ] Can accept/reject deal as supplier
- [ ] Can create purchase order
- [ ] Real-time updates work on all pages
- [ ] Notifications fetch from backend
- [ ] Dashboard shows real data
- [ ] No TypeScript errors
- [ ] `npm run build` succeeds
- [ ] Deployed to Netlify/Vercel

---

## 🎯 Success Metrics

**User Flow Test** (Buyer → Supplier):
1. Buyer logs in → Creates RFQ → Sees on RFQs page
2. Supplier logs in → Sees RFQ → Submits bid
3. Buyer sees bid notification → Awards deal
4. Supplier sees deal notification → Accepts
5. Buyer creates purchase order → Supplier sees PO notification
6. All actions show in real-time without refresh

**If this flow works end-to-end → MVP is DONE** ✅

---

## 📝 Notes

### Why This Order?
1. **Backend first** - Frontend can't test without working RPCs
2. **Auth first** - RLS blocks everything without JWT
3. **Parallel streams** - Maximize throughput after auth
4. **Dashboard last** - Depends on all data being available
5. **Cleanup last** - Don't break working code mid-build

### Risk Mitigation
- **Auth0 config** - Get domain/clientId from user early
- **RLS testing** - Use different user accounts to verify isolation
- **Real-time debugging** - Console log subscription events
- **Type safety** - Regenerate types if schema changes

### Shortcuts to Consider (If Time Constrained)
- Skip purchases (use deals only)
- Skip dashboard analytics (just show lists)
- Skip invite flow (manually add org_members via SQL)
- Skip real-time (just use refetch on interval)

---

**Next Step**: Start Stream 0 (Warp) - Create seed data script
