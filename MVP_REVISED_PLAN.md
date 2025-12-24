# Lithium Buy MVP - REVISED Implementation Plan
## Multi-Tenancy First Approach

**Status**: ✅ Types regenerated - All org/purchase RPCs available  
**Goal**: Ship working multi-tenant MVP  
**Strategy**: Auth + Orgs first, then features (org-scoped from day 1)

---

## 🎯 Critical Path (Sequential - MUST DO IN ORDER)

### Phase 0: Backend Ready ✅ COMPLETE
- [x] Types regenerated with all 9 org/purchase RPCs
- [x] Seed data script ready
- [x] SKILLS.md updated

**Status**: ✅ **READY FOR FRONTEND**

---

### Phase 1: Auth + Organization Context (Lovable) - 2 hours
**CRITICAL**: Everything else depends on this  
**Owner**: Lovable Agent

#### Part A: Auth0 Integration (45 min)
1. Install `@auth0/auth0-react`
2. Create `src/context/AuthContext.tsx`:
   ```typescript
   interface AuthContextType {
     user: User | null;
     isAuthenticated: boolean;
     isLoading: boolean;
     loginWithRedirect: () => void;
     logout: () => void;
     getAccessToken: () => Promise<string>;
   }
   ```
3. Wrap `App.tsx` with `Auth0Provider`
4. Add login/logout to TopNav

**Deliverable**: User can login via Auth0, access token available

#### Part B: Organization Context (1 hour) - NEW & CRITICAL
5. Create `src/services/organizations.service.ts`:
   ```typescript
   export const getMyOrganizations = () => callRpc('get_my_organizations');
   export const createOrganization = (params) => callRpc('create_organization', params);
   export const inviteOrgMember = (orgId, email, role) => 
     callRpc('invite_org_member', { p_org_id: orgId, p_user_email: email, p_role: role });
   export const claimOrgMembership = (orgId, token) => 
     callRpc('claim_org_membership', { p_org_id: orgId, p_invite_token: token });
   export const getOrgMembers = (orgId) => callRpc('get_org_members', { p_org_id: orgId });
   ```

6. Create `src/hooks/useOrganizations.ts`:
   ```typescript
   export const useMyOrganizations = () => {
     return useQuery({
       queryKey: ['organizations', 'my'],
       queryFn: getMyOrganizations,
     });
   };
   ```

7. Create `src/context/OrganizationContext.tsx`:
   ```typescript
   interface OrganizationContextType {
     currentOrg: Organization | null;
     organizations: Organization[];
     isLoading: boolean;
     switchOrg: (orgId: string) => void;
     hasOrganization: boolean;
   }
   
   // On auth:
   // 1. Call get_my_organizations()
   // 2. If empty → redirect to onboarding
   // 3. If exists → set currentOrg (first org or from localStorage)
   // 4. Inject currentOrg.id into JWT claims for RLS
   ```

8. Create `src/lib/supabase/authenticated-client.ts`:
   ```typescript
   export const createAuthenticatedClient = (token: string, orgId: string) => {
     return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
       global: {
         headers: {
           Authorization: `Bearer ${token}`,
           // Optional: inject org_id if using custom JWT
           'X-Org-Id': orgId,
         }
       }
     });
   };
   ```

9. Update `src/lib/supabase/rpc.ts`:
   ```typescript
   // Use authenticated client with org context
   import { useAuth } from '@/context/AuthContext';
   import { useOrganization } from '@/context/OrganizationContext';
   
   export const callRpc = async (name, params) => {
     const { getAccessToken } = useAuth();
     const { currentOrg } = useOrganization();
     const token = await getAccessToken();
     const client = createAuthenticatedClient(token, currentOrg?.id);
     return client.rpc(name, params);
   };
   ```

10. Wrap `App.tsx`:
    ```tsx
    <Auth0Provider>
      <AuthContext>
        <OrganizationContext>
          <App />
        </OrganizationContext>
      </AuthContext>
    </Auth0Provider>
    ```

**Deliverable**: User authenticated + current org available globally

---

### Phase 2: Organization Onboarding (Lovable) - 1.5 hours
**BLOCKS**: All feature work (users need org first)  
**Owner**: Lovable Agent

#### Tasks:
1. Create `src/pages/Onboarding.tsx`:
   - Route: `/onboarding`
   - Shows if `hasOrganization === false`
   - 2 tabs: "Create Organization" | "Join Organization"

2. Create `src/components/org/CreateOrgForm.tsx`:
   ```typescript
   // Form fields:
   - org_type: buyer | supplier | admin | partner
   - name: string
   - email: string (optional)
   - phone: string (optional)
   
   // On submit:
   - Call createOrganization()
   - Automatically adds user as owner (via RPC)
   - Refetch organizations
   - Redirect to dashboard
   ```

3. Create `src/components/org/ClaimMembershipForm.tsx`:
   ```typescript
   // For suppliers receiving email invites
   // Form fields:
   - invite_token: string (from URL param or email link)
   - org_id: uuid (from URL param)
   
   // On submit:
   - Call claimOrgMembership()
   - Refetch organizations
   - Redirect to dashboard
   ```

4. Create `src/components/org/OrgSwitcher.tsx`:
   - Dropdown in TopNav
   - Shows current org name
   - Lists all user's orgs
   - onClick: `switchOrg(org.id)`

5. Update routing in `App.tsx`:
   ```typescript
   // Protected route wrapper
   const ProtectedRoute = ({ children }) => {
     const { isAuthenticated, isLoading } = useAuth();
     const { hasOrganization, isLoading: orgLoading } = useOrganization();
     
     if (isLoading || orgLoading) return <LoadingScreen />;
     if (!isAuthenticated) return <Navigate to="/login" />;
     if (!hasOrganization) return <Navigate to="/onboarding" />;
     return children;
   };
   ```

**Deliverable**: Complete org onboarding flow + org switcher

---

### Phase 3: Purchases (Lovable) - 1.5 hours
**NEW FEATURE**: Purchase order management  
**Owner**: Lovable Agent

#### Tasks:
1. Create `src/services/purchases.service.ts`:
   ```typescript
   export const createPurchase = (params) => callRpc('create_purchase', {
     p_buyer_org_id: params.buyerOrgId,
     p_supplier_org_id: params.supplierOrgId,
     p_deal_id: params.dealId,
     p_total_amount: params.totalAmount,
     p_currency: params.currency || 'USD',
     p_payload: params.payload || {},
     p_notes: params.notes,
   });
   
   export const listPurchases = () => callRpc('list_purchases');
   export const getPurchase = (poNumber) => callRpc('get_purchase', { p_purchase_id: poNumber });
   export const updatePurchaseStatus = (poNumber, status) => 
     callRpc('update_purchase_status', { p_purchase_id: poNumber, p_status: status });
   ```

2. Create `src/hooks/usePurchases.ts`:
   ```typescript
   export const usePurchases = () => {
     return useQuery({
       queryKey: ['purchases'],
       queryFn: listPurchases,
     });
   };
   
   export const useCreatePurchase = () => {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: createPurchase,
       onSuccess: () => {
         queryClient.invalidateQueries(['purchases']);
         toast.success('Purchase order created');
       },
     });
   };
   ```

3. Create `src/pages/Purchases.tsx`:
   - List all purchases with PO-2025-NNNNNN format
   - Show: PO number, buyer, supplier, status, amount, date
   - Filter by status (pending/accepted/rejected/paid/shipped/delivered/cancelled)
   - Click → detail view

4. Create `src/components/purchase/CreatePurchaseDialog.tsx`:
   - Button: "Create Purchase Order" (on Deal detail page)
   - Form fields:
     - supplier_org_id (from deal)
     - deal_id (auto-filled)
     - total_amount
     - currency
     - notes
   - On submit: calls `createPurchase()`

5. Create `src/components/purchase/PurchaseStatusBadge.tsx`:
   - Color-coded badges for each status

6. Add `/purchases` to navigation

**Deliverable**: Complete PO management UI

---

### Phase 4: Team Management (Lovable) - 1 hour
**NEW FEATURE**: Org member management  
**Owner**: Lovable Agent

#### Tasks:
1. Create `src/pages/Settings/Team.tsx`:
   - Route: `/settings/team`
   - List org members (from `getOrgMembers()`)
   - Show: name (from Auth0), role, joined date
   - Button: "Invite Member"

2. Create `src/components/org/InviteMemberDialog.tsx`:
   - Form fields:
     - email: string
     - role: owner | admin | member | viewer
   - On submit:
     - Call `inviteOrgMember(currentOrg.id, email, role)`
     - Returns `{ invite_token, expires_at }`
     - Show invite link: `https://app.com/onboarding/claim?token={token}&org={orgId}`
     - Copy to clipboard button
     - Send email (future: via Edge Function)

3. Update `src/pages/Onboarding.tsx`:
   - Handle `/onboarding/claim?token=xxx&org=xxx` URL params
   - Pre-fill ClaimMembershipForm

**Deliverable**: Invite and manage team members

---

### Phase 5: Update Existing Features for Multi-Tenancy (Lovable) - 2 hours
**CRITICAL**: Make all features org-scoped  
**Owner**: Lovable Agent

#### Tasks:
1. Update all RPC calls to use authenticated client with org context
2. Update NotificationContext:
   - Call `get_notifications()` (already org-scoped by RLS)
   - Call `mark_notification_read()`
   - Add realtime subscription (org-scoped)

3. Create `src/hooks/useRealtimeSubscription.ts`:
   ```typescript
   export const useRealtimeSubscription = (table, callback) => {
     const { currentOrg } = useOrganization();
     
     useEffect(() => {
       const channel = supabase
         .channel(`${table}_${currentOrg?.id}`)
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table: table,
           filter: `org_id=eq.${currentOrg?.id}`, // Org-scoped filter
         }, callback)
         .subscribe();
       
       return () => { channel.unsubscribe(); };
     }, [table, currentOrg]);
   };
   ```

4. Add realtime to existing hooks:
   - `useRFQs` - invalidate on rfqs changes
   - `useAuctions` - invalidate on auctions changes
   - `useDeals` - invalidate on deals changes
   - `useBids` - invalidate on bids changes
   - `usePurchases` - invalidate on purchases changes

5. Update Dashboard:
   - Show org-level stats (not user-level)
   - Add recent purchases to activity feed
   - Show org name in header

**Deliverable**: All features work with org isolation

---

### Phase 6: Action Forms (Lovable) - 1.5 hours
**SAME AS BEFORE**: CRUD forms for RFQs, Bids, Deals

#### Tasks:
1. Create `src/components/rfq/CreateRFQDialog.tsx`
2. Create `src/components/bid/SubmitBidForm.tsx`
3. Create `src/components/deal/DealResponseButtons.tsx`
4. Create `src/components/bid/AwardDealButton.tsx`
5. Wire up to pages

**Deliverable**: All CRUD flows working

---

### Phase 7: Polish & Cleanup (Lovable) - 30 min
**SAME AS BEFORE**: Archive legacy, fix errors, deploy

---

## 📊 Updated Timeline

| Phase | Duration | Owner | Blocker? |
|-------|----------|-------|----------|
| 0: Backend | ✅ DONE | Warp | - |
| 1: Auth + Org Context | 2 hours | Lovable | CRITICAL |
| 2: Onboarding | 1.5 hours | Lovable | Phase 1 |
| 3: Purchases | 1.5 hours | Lovable | Phase 1 |
| 4: Team Management | 1 hour | Lovable | Phase 1 |
| 5: Multi-Tenant Features | 2 hours | Lovable | Phase 1 |
| 6: Action Forms | 1.5 hours | Lovable | Phase 5 |
| 7: Cleanup | 30 min | Lovable | Phase 6 |

**Total**: ~10 hours (no parallelization due to org dependency)  
**Can Parallelize**: Phases 3 & 4 can run parallel after Phase 1

---

## ✅ Updated Definition of Done

### Backend (Warp)
- [x] Types regenerated with all RPCs
- [x] Seed data script ready
- [x] SKILLS.md updated

### Frontend (Lovable)
- [ ] Auth0 working
- [ ] OrganizationContext provides currentOrg
- [ ] Org onboarding flow (create/claim)
- [ ] Org switcher in TopNav
- [ ] Purchase order management
- [ ] Team member invites
- [ ] All features org-scoped via RLS
- [ ] Real-time subscriptions (org-filtered)
- [ ] All CRUD forms functional
- [ ] No TypeScript errors
- [ ] Builds cleanly
- [ ] Deployed

---

## 🎯 Success Flow (Updated)

**End-to-End Test**:
1. User A logs in → Creates "Tesla" buyer org → Becomes owner
2. User A creates RFQ → Visible only to Tesla members
3. User B logs in → Creates "Albemarle" supplier org → Becomes owner
4. User B sees RFQ → Submits bid
5. User A awards deal to User B
6. User B accepts deal
7. User A creates purchase order → User B sees PO-2025-000001
8. User A invites User C to Tesla → User C claims membership
9. User C logs in → Sees Tesla org → Sees all Tesla RFQs/deals
10. All actions real-time without refresh

**If this works → MVP DONE** ✅

---

## 🚨 Critical Dependencies

```
Phase 1 (Auth + Org Context)
    ↓
    ├─→ Phase 2 (Onboarding) ──→ REQUIRED FOR ALL USERS
    ├─→ Phase 3 (Purchases)  ──→ Can parallelize with Phase 4
    ├─→ Phase 4 (Team Mgmt)  ──→ Can parallelize with Phase 3
    └─→ Phase 5 (Multi-Tenant) ──→ MUST HAPPEN BEFORE PHASE 6
           ↓
        Phase 6 (Forms) ──→ Uses org context
           ↓
        Phase 7 (Cleanup)
```

---

## 📝 Key Differences from Original Plan

### OLD PLAN:
- Auth first, features second
- No org context
- Direct RLS via JWT `org_id` claim

### NEW PLAN (REVISED):
- **Auth + Org Context first** (critical blocker)
- **Onboarding flow required** (users MUST join/create org)
- **Purchases as first-class feature** (not an afterthought)
- **Team management** (invite/claim flow)
- **All features org-scoped from day 1**
- **Org switcher** (users can belong to multiple orgs)

---

## 🚀 Next Action

**START PHASE 1** in Lovable:
1. Install `@auth0/auth0-react`
2. Create AuthContext
3. Create organizations.service.ts
4. Create OrganizationContext
5. Create authenticated Supabase client
6. Test login + org fetch

**Reference**: This document + `SKILLS.md` for RPC patterns
