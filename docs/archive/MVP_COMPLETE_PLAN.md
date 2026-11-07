# Lithium Buy MVP - Complete Implementation Plan
## All Phases: Frontend + Backend Detailed Breakdown

**Last Updated**: 2025-12-24 05:00 UTC  
**Status**: Backend ✅ Complete | Frontend 🔄 Phase 1 In Progress

---

## 📊 Executive Summary

### Current State
- **Backend**: 100% complete (52 tables, 24 RPCs, all migrations applied)
- **Frontend**: 70% UI exists, 0% Auth/Org integration
- **Services**: 8/10 services implemented (missing: organizations, purchases)
- **Hooks**: 12/15 hooks implemented (missing: organizations, purchases, realtime)
- **Pages**: 15/17 pages exist (missing: Onboarding, Purchases)

### What Needs to Be Built
1. **Phase 1**: Auth + OrganizationContext (2hrs) - **IN PROGRESS**
2. **Phase 2**: Onboarding + Org Switcher (1.5hrs)
3. **Phase 3**: Purchases Management (1.5hrs)
4. **Phase 4**: Team Management (1hr)
5. **Phase 5**: Multi-Tenant Updates (2hrs)
6. **Phase 6**: Action Forms (1.5hrs)
7. **Phase 7**: Cleanup (30min)

**Total**: ~10 hours

---

## 🔍 DETAILED AUDIT

### Existing Pages (15 total)
| Page | Route | Status | Needs Work |
|------|-------|--------|------------|
| Dashboard | `/dashboard` | ✅ Exists | ✅ Update with real data |
| RFQs | `/rfqs`, `/rfqs/:id` | ✅ Exists | ✅ Add CreateRFQDialog |
| Bids | `/bids` | ✅ Exists | ✅ Add SubmitBidForm |
| Auctions | `/auctions`, `/auctions/:id` | ✅ Exists | ✅ Add PlaceBidForm |
| Deals | `/deals`, `/deals/:id` | ✅ Exists | ✅ Add ResponseButtons |
| Orders | `/orders` | ✅ Exists | ⚠️ Rename to Purchases |
| Marketplace | `/marketplace`, `/marketplace/:id` | ✅ Exists | ✅ Connect to listings RPC |
| TeleBuy | `/telebuy` | ✅ Exists | ✅ Keep as-is (feature complete) |
| AI Studio | `/ai-studio` | ✅ Exists | ✅ Keep as-is |
| Data | `/data` | ✅ Exists | ✅ Keep as-is |
| Analytics | `/analytics` | ✅ Exists | ✅ Keep as-is |
| Settings | `/settings` | ✅ Exists | ✅ Add Team tab |
| Billing | `/settings/billing` | ✅ Exists | ✅ Keep as-is |
| Verification | `/verification` | ✅ Exists | ✅ Keep as-is |
| Messages | `/messages` | ✅ Exists | ✅ Keep as-is |
| NotFound | `/*` | ✅ Exists | ✅ Keep as-is |

### Missing Pages (2 total)
| Page | Route | Purpose |
|------|-------|---------|
| Onboarding | `/onboarding` | Create/claim organization |
| Auth | `/auth`, `/callback` | Auth0 login/callback |

### Existing Services (8 total)
| Service | RPCs Used | Status |
|---------|-----------|--------|
| rfqs.service.ts | `list_rfqs`, `create_rfq` | ✅ Complete |
| bids.service.ts | `submit_bid`, `withdraw_bid` | ✅ Complete |
| deals.service.ts | `create_deal`, `update_deal_status`, `respond_to_offer` | ✅ Complete |
| auctions.service.ts | `list_auctions`, `place_auction_bid` | ✅ Complete |
| notifications.service.ts | `get_notifications`, `mark_notification_read` | ✅ Complete |
| market.service.ts | `get_price_indicators` | ✅ Complete |
| listings.service.ts | `list_listings`, `get_listing` | ✅ Complete |
| suppliers.service.ts | Various supplier queries | ✅ Complete |

### Missing Services (2 total)
| Service | RPCs Needed | Purpose |
|---------|-------------|---------|
| organizations.service.ts | `create_organization`, `get_my_organizations`, `invite_org_member`, `claim_org_membership`, `get_org_members` | Org management |
| purchases.service.ts | `create_purchase`, `list_purchases`, `get_purchase`, `update_purchase_status` | PO management |

### Existing Hooks (12 total)
| Hook | Service | Status |
|------|---------|--------|
| useRFQs.ts | rfqs.service.ts | ✅ Complete |
| useBids.ts | bids.service.ts | ✅ Complete |
| useDeals.ts | deals.service.ts | ✅ Complete |
| useAuctions.ts | auctions.service.ts | ✅ Complete |
| useNotifications.ts | notifications.service.ts | ⚠️ Update with backend |
| useMarket.ts | market.service.ts | ✅ Complete |
| useListings.ts | listings.service.ts | ✅ Complete |
| useSuppliers.ts | suppliers.service.ts | ✅ Complete |
| useOrders.ts | (local) | ⚠️ Delete (use usePurchases) |
| useDashboard.ts | (aggregate) | ⚠️ Update with real stats |
| useTelebuy.ts | telebuy.service.ts | ✅ Complete (keep) |
| use-mobile.tsx | (UI helper) | ✅ Complete |

### Missing Hooks (3 total)
| Hook | Service | Purpose |
|------|---------|---------|
| useOrganizations.ts | organizations.service.ts | CRUD orgs |
| usePurchases.ts | purchases.service.ts | CRUD POs |
| useRealtimeSubscription.ts | (Supabase realtime) | Live updates |

### Existing Context (2 total)
| Context | Status | Needs Work |
|---------|--------|------------|
| RoleContext | ⚠️ Mock (localStorage) | ✅ DELETE (replaced by OrganizationContext) |
| NotificationContext | ⚠️ Local state | ✅ Connect to backend RPCs |

### Missing Context (2 total)
| Context | Purpose |
|---------|---------|
| AuthContext | Auth0 integration |
| OrganizationContext | Multi-tenant org management |

---

## 📋 PHASE-BY-PHASE IMPLEMENTATION

## PHASE 1: Auth + Organization Context (2 hours) 🔄 IN PROGRESS

### Backend Tasks ✅ COMPLETE
- [x] All RPCs exist
- [x] Types generated
- [x] Seed data ready
- [x] Setup docs complete

### Frontend Tasks (Frontend)
#### 1.1 Install Dependencies (2 min)
```bash
npm install @auth0/auth0-react
# or
bun add @auth0/auth0-react
```

#### 1.2 Create AuthContext (20 min)
**File**: `src/context/AuthContext.tsx`
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithRedirect: () => void;
  logout: (options?: LogoutOptions) => void;
  getAccessToken: () => Promise<string>;
}

// Wrap Auth0's useAuth0 hook
// Add token caching
// Export useAuth() hook
```

#### 1.3 Create Organizations Service (15 min)
**File**: `src/services/organizations.service.ts`
```typescript
export const getMyOrganizations = () => callRpc('get_my_organizations');
export const createOrganization = (params) => callRpc('create_organization', {
  p_org_type: params.orgType,
  p_name: params.name,
  p_email: params.email,
  p_phone: params.phone,
});
export const inviteOrgMember = (orgId, email, role) => callRpc('invite_org_member', {
  p_org_id: orgId,
  p_user_email: email,
  p_role: role,
});
export const claimOrgMembership = (orgId, token) => callRpc('claim_org_membership', {
  p_org_id: orgId,
  p_invite_token: token,
});
export const getOrgMembers = (orgId) => callRpc('get_org_members', {
  p_org_id: orgId,
});
```

#### 1.4 Create Organizations Hooks (15 min)
**File**: `src/hooks/useOrganizations.ts`
```typescript
export const useMyOrganizations = () => {
  return useQuery({
    queryKey: ['organizations', 'my'],
    queryFn: getMyOrganizations,
    enabled: !!useAuth().isAuthenticated,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast.success('Organization created');
    },
  });
};

// ... other mutations
```

#### 1.5 Create OrganizationContext (30 min)
**File**: `src/context/OrganizationContext.tsx`
```typescript
interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  switchOrg: (orgId: string) => void;
  hasOrganization: boolean;
}

// Fetch orgs on auth
// Store selected org in localStorage
// Provide switchOrg function
```

#### 1.6 Create Authenticated Supabase Client (15 min)
**File**: `src/lib/supabase/authenticated-client.ts`
```typescript
export const createAuthenticatedClient = (token: string) => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  );
};
```

#### 1.7 Update RPC Wrapper (10 min)
**File**: `src/lib/supabase/rpc.ts`
```typescript
// Update callRpc to use authenticated client
// Get token from AuthContext
// Inject into all RPC calls
```

#### 1.8 Wrap App.tsx (5 min)
```typescript
<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin + '/callback',
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  }}
>
  <QueryClientProvider client={queryClient}>
    <AuthContextProvider>
      <OrganizationContextProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </OrganizationContextProvider>
    </AuthContextProvider>
  </QueryClientProvider>
</Auth0Provider>
```

#### 1.9 Create Auth Page (10 min)
**File**: `src/pages/Auth.tsx`
```typescript
// Simple login page
// Redirect to Auth0
// Handle callback
```

#### 1.10 Update LayoutShell (15 min)
**File**: `src/components/layout/LayoutShell.tsx`
- Replace RoleSwitcher with OrgSwitcher
- Show real user info from AuthContext
- Add logout button

#### 1.11 Delete RoleContext (5 min)
- Remove `src/context/RoleContext.tsx`
- Remove all `useRole()` imports
- Remove RoleProvider from App.tsx

---

## PHASE 2: Onboarding + Org Switcher (1.5 hours)

### 2.1 Create Onboarding Page (30 min)
**File**: `src/pages/Onboarding.tsx`
```typescript
// Route: /onboarding
// Two tabs: Create Organization | Join Organization
// Form validation with zod
// Redirect to dashboard after success
```

### 2.2 Create CreateOrgForm Component (20 min)
**File**: `src/components/org/CreateOrgForm.tsx`
```typescript
// Form fields: org_type, name, email, phone
// Use useCreateOrganization() mutation
// Toast on success
```

### 2.3 Create ClaimMembershipForm Component (15 min)
**File**: `src/components/org/ClaimMembershipForm.tsx`
```typescript
// Form fields: invite_token (from URL), org_id (from URL)
// Use useClaimMembership() mutation
// Toast on success
```

### 2.4 Create OrgSwitcher Component (15 min)
**File**: `src/components/org/OrgSwitcher.tsx`
```typescript
// Dropdown showing current org
// List all user's orgs
// onClick: switchOrg(org.id)
// Place in LayoutShell header
```

### 2.5 Create Protected Route Wrapper (10 min)
**File**: `src/components/auth/ProtectedRoute.tsx`
```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasOrganization, isLoading: orgLoading } = useOrganization();
  
  if (isLoading || orgLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (!hasOrganization) return <Navigate to="/onboarding" />;
  return children;
};
```

### 2.6 Update App.tsx Routes (10 min)
```typescript
<Routes>
  <Route path="/auth" element={<Auth />} />
  <Route path="/callback" element={<Auth />} />
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/*" element={<ProtectedRoute><MainRoutes /></ProtectedRoute>} />
</Routes>
```

---

## PHASE 3: Purchases Management (1.5 hours)

### 3.1 Create Purchases Service (15 min)
**File**: `src/services/purchases.service.ts`
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
export const updatePurchaseStatus = (poNumber, status) => callRpc('update_purchase_status', {
  p_purchase_id: poNumber,
  p_status: status,
});
```

### 3.2 Create Purchases Hooks (15 min)
**File**: `src/hooks/usePurchases.ts`
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

// ... other mutations
```

### 3.3 Rename Orders Page to Purchases (5 min)
- Rename `src/pages/Orders.tsx` → `src/pages/Purchases.tsx`
- Update route in App.tsx: `/orders` → `/purchases`
- Delete `src/hooks/useOrders.ts`

### 3.4 Update Purchases Page (30 min)
**File**: `src/pages/Purchases.tsx`
```typescript
// Use usePurchases() hook instead of mock data
// Display: PO number (PO-2025-NNNNNN), buyer, supplier, status, amount, date
// Add filter by status dropdown
// Add "Create Purchase Order" button
// Click row → detail view with full payload
```

### 3.5 Create PurchaseStatusBadge Component (10 min)
**File**: `src/components/purchase/PurchaseStatusBadge.tsx`
```typescript
// Color-coded badges for each status
// pending: yellow, accepted: blue, paid: green, shipped: purple, delivered: green, cancelled: red, rejected: red
```

### 3.6 Create CreatePurchaseDialog Component (25 min)
**File**: `src/components/purchase/CreatePurchaseDialog.tsx`
```typescript
// Form fields: supplier_org_id, deal_id (optional), total_amount, currency, notes
// Use useCreatePurchase() mutation
// Show on Deal detail page
```

---

## PHASE 4: Team Management (1 hour)

### 4.1 Add Team Tab to Settings Page (10 min)
**File**: `src/pages/Settings.tsx`
- Add "Team" tab to existing Settings tabs
- Route: `/settings/team`

### 4.2 Create Team Page Component (25 min)
**File**: `src/pages/Settings/Team.tsx`
```typescript
// List org members via useOrgMembers(currentOrg.id)
// Display: Avatar (from Auth0), email, role, joined date
// "Invite Member" button
```

### 4.3 Create InviteMemberDialog Component (25 min)
**File**: `src/components/org/InviteMemberDialog.tsx`
```typescript
// Form fields: email, role (dropdown)
// On submit: call inviteOrgMember()
// Show invite link: https://app.com/onboarding?token=xxx&org=xxx
// Copy to clipboard button
// Future: Send email via Edge Function
```

---

## PHASE 5: Multi-Tenant Updates (2 hours)

### 5.1 Update NotificationContext (30 min)
**File**: `src/context/NotificationContext.tsx`
- Replace mock data with `useNotifications()` hook
- Call `get_notifications()` on mount
- Call `mark_notification_read()` on mark
- Add realtime subscription

### 5.2 Create Realtime Subscription Hook (20 min)
**File**: `src/hooks/useRealtimeSubscription.ts`
```typescript
export const useRealtimeSubscription = (table: string, callback: () => void) => {
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
    
    return () => { channel.unsubscribe(); };
  }, [table, currentOrg]);
};
```

### 5.3 Add Realtime to Data Hooks (40 min)
Update each hook to invalidate queries on realtime events:

**Files**:
- `src/hooks/useRFQs.ts` - Add useRealtimeSubscription('rfqs')
- `src/hooks/useBids.ts` - Add useRealtimeSubscription('bids')
- `src/hooks/useDeals.ts` - Add useRealtimeSubscription('deals')
- `src/hooks/useAuctions.ts` - Add useRealtimeSubscription('auctions')
- `src/hooks/usePurchases.ts` - Add useRealtimeSubscription('purchases')

### 5.4 Update Dashboard with Real Data (30 min)
**File**: `src/pages/Dashboard.tsx`
- Replace mock data with hooks:
  - `const { data: rfqs } = useRFQs()`
  - `const { data: deals } = useDeals()`
  - `const { data: purchases } = usePurchases()`
- Calculate KPIs from real data
- Show org name in header

---

## PHASE 6: Action Forms (1.5 hours)

### 6.1 Create CreateRFQDialog Component (25 min)
**File**: `src/components/rfq/CreateRFQDialog.tsx`
```typescript
// Form fields: title, description, product_id, target_quantity, target_unit, incoterms, delivery_location
// Use useCreateRFQ() mutation
// Validation with zod
```

### 6.2 Add "Create RFQ" Button to RFQs Page (5 min)
**File**: `src/pages/RFQs.tsx`
- Add button in header
- Opens CreateRFQDialog

### 6.3 Create SubmitBidForm Component (20 min)
**File**: `src/components/bid/SubmitBidForm.tsx`
```typescript
// Form fields: price, currency, quantity, lead_time_days, notes
// Use useSubmitBid() mutation
// Show on RFQ detail page for suppliers
```

### 6.4 Add "Submit Bid" Button to RFQ Detail (5 min)
**File**: `src/pages/RFQs.tsx`
- Show when viewing RFQ detail
- Only for suppliers
- Opens SubmitBidForm

### 6.5 Create DealResponseButtons Component (15 min)
**File**: `src/components/deal/DealResponseButtons.tsx`
```typescript
// Accept / Reject buttons
// Note textarea on reject
// Use useRespondToOffer() mutation
// Show on Deal detail for suppliers
```

### 6.6 Add Response Buttons to Deal Detail (5 min)
**File**: `src/pages/Deals.tsx`
- Show when viewing Deal detail
- Only for suppliers when status = 'pending'

### 6.7 Create AwardDealButton Component (15 min)
**File**: `src/components/bid/AwardDealButton.tsx`
```typescript
// Award button for buyers
// Confirmation dialog
// Use useCreateDeal() mutation
// Show on Bid card/detail
```

### 6.8 Add Award Button to Bids List (5 min)
**File**: `src/pages/Bids.tsx`
- Show on each bid
- Only for buyers

---

## PHASE 7: Cleanup & Deploy (30 min)

### 7.1 Archive Legacy Services (10 min)
Create `src/services/_legacy/` folder and move:
- `files.service.ts`
- `documents.service.ts`
- `jobs.service.ts`
- `usage.service.ts`
- `telebuy.service.ts` (keep if still used)

### 7.2 Update Service Index (5 min)
**File**: `src/services/index.ts`
```typescript
// Export only Lithium Buy services
export * from './organizations.service';
export * from './purchases.service';
// ... (existing exports)
```

### 7.3 Fix TypeScript Errors (10 min)
```bash
npm run type-check
# or
tsc --noEmit
```

### 7.4 Test Build (5 min)
```bash
npm run build
```

### 7.5 Deploy to Netlify/Vercel (if configured)
```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod
```

---

## 🎯 COMPONENT CREATION CHECKLIST

### Components to Create (18 total)
- [ ] `src/context/AuthContext.tsx`
- [ ] `src/context/OrganizationContext.tsx`
- [ ] `src/services/organizations.service.ts`
- [ ] `src/services/purchases.service.ts`
- [ ] `src/hooks/useOrganizations.ts`
- [ ] `src/hooks/usePurchases.ts`
- [ ] `src/hooks/useRealtimeSubscription.ts`
- [ ] `src/lib/supabase/authenticated-client.ts`
- [ ] `src/pages/Auth.tsx`
- [ ] `src/pages/Onboarding.tsx`
- [ ] `src/components/auth/ProtectedRoute.tsx`
- [ ] `src/components/org/CreateOrgForm.tsx`
- [ ] `src/components/org/ClaimMembershipForm.tsx`
- [ ] `src/components/org/OrgSwitcher.tsx`
- [ ] `src/components/org/InviteMemberDialog.tsx`
- [ ] `src/components/rfq/CreateRFQDialog.tsx`
- [ ] `src/components/bid/SubmitBidForm.tsx`
- [ ] `src/components/bid/AwardDealButton.tsx`
- [ ] `src/components/deal/DealResponseButtons.tsx`
- [ ] `src/components/purchase/CreatePurchaseDialog.tsx`
- [ ] `src/components/purchase/PurchaseStatusBadge.tsx`
- [ ] `src/pages/Settings/Team.tsx`

### Files to Modify (10 total)
- [ ] `src/App.tsx` - Wrap with Auth0Provider, add auth routes, add protected routes
- [ ] `src/lib/supabase/rpc.ts` - Use authenticated client
- [ ] `src/components/layout/LayoutShell.tsx` - Replace RoleSwitcher with OrgSwitcher
- [ ] `src/context/NotificationContext.tsx` - Connect to backend RPCs
- [ ] `src/pages/Dashboard.tsx` - Use real data from hooks
- [ ] `src/pages/RFQs.tsx` - Add CreateRFQDialog button, Add SubmitBid button
- [ ] `src/pages/Bids.tsx` - Add AwardDeal button
- [ ] `src/pages/Deals.tsx` - Add DealResponseButtons
- [ ] `src/pages/Purchases.tsx` - Rename from Orders, use real data
- [ ] `src/pages/Settings.tsx` - Add Team tab

### Files to Delete (2 total)
- [ ] `src/context/RoleContext.tsx`
- [ ] `src/hooks/useOrders.ts`

---

## 📦 DEPENDENCIES TO INSTALL

```json
{
  "dependencies": {
    "@auth0/auth0-react": "^2.2.4"
  }
}
```

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://api.lithiumbuy.com (optional)
VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## ✅ DEFINITION OF DONE

### Phase 1
- [ ] User can login via Auth0
- [ ] User can logout
- [ ] JWT token injected into all Supabase calls
- [ ] OrganizationContext provides currentOrg
- [ ] No TypeScript errors

### Phase 2
- [ ] User can create organization
- [ ] User can claim membership (join org)
- [ ] Org switcher shows all user's orgs
- [ ] Protected routes redirect unauthenticated users
- [ ] No org → redirect to onboarding

### Phase 3
- [ ] Purchases page shows PO list
- [ ] Can create purchase order from deal
- [ ] PO numbers display as PO-2025-NNNNNN
- [ ] Status badges color-coded

### Phase 4
- [ ] Settings/Team page shows org members
- [ ] Can invite member via email
- [ ] Invite link generated and copyable

### Phase 5
- [ ] Notifications fetch from backend
- [ ] Real-time updates work on all pages
- [ ] Dashboard shows real org-level data
- [ ] All features org-scoped via RLS

### Phase 6
- [ ] Can create RFQ via dialog
- [ ] Can submit bid on RFQ
- [ ] Supplier can accept/reject deal
- [ ] Buyer can award deal to bid

### Phase 7
- [ ] Legacy services archived
- [ ] No TypeScript errors
- [ ] `npm run build` succeeds
- [ ] Deployed (optional)

---

## 🚀 EXECUTION STRATEGY

### Sequential Phases (No Shortcuts)
```
Phase 1 (2hrs)
    ↓
Phase 2 (1.5hrs) 
    ↓
Phase 3 (1.5hrs) ──┐
Phase 4 (1hr) ─────┤ Can parallelize
    ↓              │
Phase 5 (2hrs) ←───┘
    ↓
Phase 6 (1.5hrs)
    ↓
Phase 7 (30min)
```

### Parallel Optimization (Faster)
```
Phase 1 (2hrs)
    ↓
├─ Phase 2 (1.5hrs)
├─ Phase 3 (1.5hrs) ─────┐
└─ Phase 4 (1hr) ────────┤
                         ↓
                   Phase 5 (2hrs)
                         ↓
                   Phase 6 (1.5hrs)
                         ↓
                   Phase 7 (30min)
```

**Total**: ~10 hours sequential, ~8 hours with parallelization

---

## 📚 REFERENCE DOCUMENTS

- **Setup**: QUICK_START.md
- **API Reference**: SKILLS.md
- **Plan Overview**: MVP_REVISED_PLAN.md
- **Status Tracker**: MVP_STATUS.md
- **Backend Verification**: Database schema verified ✅

---

**READY TO BUILD** 🚢
