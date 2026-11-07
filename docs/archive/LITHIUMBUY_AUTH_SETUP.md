# LithiumBuy Auth0 + Multi-Tenant Setup Guide

**Complete Implementation Reference for AI Assistants**

---

## 📋 Project Overview

**Application**: LithiumBuy  
**Description**: B2B marketplace connecting lithium buyers (Tesla, Panasonic) with suppliers (Albemarle, SQM, Livent)  
**Tech Stack**: React 18 + Vite + TypeScript + Supabase + TailwindCSS  
**Architecture**: Multi-tenant SaaS with organization-based access control  
**Auth Provider**: Auth0 (Single Page Application)

---

## 🔐 Auth0 Configuration

### Application Details
```
Domain: dev-vbox82zyf82ityy0.us.auth0.com
Client ID: YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW
Application Type: Single Page Application
Grant Types: Authorization Code, Refresh Token, Implicit
```

### Callback URLs
```
Development: http://localhost:5173/callback
Production: https://lithiumbuy.com/callback, https://www.lithiumbuy.com/callback
```

---

## 🚀 Quick Setup Instructions

### Step 1: Environment Variables
Create `.env.local` in project root:

```bash
# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-vbox82zyf82ityy0.us.auth0.com
VITE_AUTH0_CLIENT_ID=YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW
VITE_AUTH0_AUDIENCE=https://api.lithiumbuy.com
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback

# Supabase Configuration
VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWt3Y2trbmZqaXZqaWdoaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTEyNjUsImV4cCI6MjA1MDU2NzI2NX0.8kE5RaGP4qAKPnw3L1a2O-TuIcKvRMqo4hgkxXr_Nsg
```

### Step 2: Install Auth0 SDK
```bash
npm install @auth0/auth0-react
# or
bun add @auth0/auth0-react
```

### Step 3: Verify Files Exist
These were created in Phases 1-4:
- ✅ `src/context/AuthContext.tsx`
- ✅ `src/context/OrganizationContext.tsx`
- ✅ `src/services/organizations.service.ts`
- ✅ `src/hooks/useOrganizations.ts`
- ✅ `src/pages/Auth.tsx`
- ✅ `src/pages/Onboarding.tsx`
- ✅ `src/components/auth/ProtectedRoute.tsx`
- ✅ `src/components/org/OrgSwitcher.tsx`

### Step 4: Test Login
```bash
npm run dev
# or
bun dev
```

Visit http://localhost:5173 → Click "Login" → Redirects to Auth0 → Login → Redirects back

---

## 🏗️ Architecture: Multi-Tenant Data Flow

### Authentication Flow
```
1. User clicks "Login"
   ↓
2. Redirects to Auth0 Universal Login
   ↓
3. User enters credentials (email/password)
   ↓
4. Auth0 returns JWT with user.sub (e.g., "auth0|123...")
   ↓
5. App stores token and user in AuthContext
   ↓
6. OrganizationContext queries Supabase:
   SELECT org_id, organizations.name, organizations.type
   FROM org_members
   JOIN organizations ON org_members.org_id = organizations.id
   WHERE org_members.user_id = current_sub()
   ↓
7. Returns user's organizations: [Tesla, Albemarle, ...]
   ↓
8. Sets currentOrg to first org (or last selected from localStorage)
   ↓
9. All Supabase queries filtered by: WHERE org_id = currentOrg.id
   ↓
10. RLS policies enforce: user can only access data from their org(s)
```

---

## 👥 User Scenarios

### Scenario A: Single-Org Buyer (Tesla)
```
User: buyer@test.com
Organizations: [{ id: 'tesla-uuid', name: 'Tesla', type: 'buyer' }]

Flow:
1. Login → Auth0 returns sub: "auth0|buyer-123"
2. Query org_members → Returns [tesla-uuid]
3. Set currentOrg = Tesla
4. No dropdown shown (only 1 org)
5. Dashboard shows Tesla's RFQs, Bids, Deals, Purchases
6. All data queries: WHERE org_id = 'tesla-uuid'
```

### Scenario B: Single-Org Supplier (Albemarle)
```
User: supplier@test.com
Organizations: [{ id: 'albemarle-uuid', name: 'Albemarle', type: 'supplier' }]

Flow:
1. Login → Auth0 returns sub: "auth0|supplier-456"
2. Query org_members → Returns [albemarle-uuid]
3. Set currentOrg = Albemarle
4. Dashboard shows Albemarle's RFQs (received), Bids (submitted), Deals
5. All data queries: WHERE org_id = 'albemarle-uuid'
```

### Scenario C: Multi-Org User (Consultant)
```
User: consultant@test.com
Organizations: [
  { id: 'tesla-uuid', name: 'Tesla', type: 'buyer' },
  { id: 'rio-tinto-uuid', name: 'Rio Tinto', type: 'buyer' }
]

Flow:
1. Login → Auth0 returns sub: "auth0|consultant-789"
2. Query org_members → Returns [tesla-uuid, rio-tinto-uuid]
3. Set currentOrg = last selected (from localStorage) OR first org
4. OrgSwitcher dropdown shown in header: [Tesla ▼]
5. User clicks dropdown → Selects "Rio Tinto"
6. currentOrg updated → All queries refetch with new org_id
7. Dashboard updates to show Rio Tinto's data
```

---

## 🗄️ Database Schema

### organizations table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('buyer', 'supplier', 'both')),
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### org_members table (junction table)
```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Auth0 sub (e.g., "auth0|123...")
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  invite_token TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
```

### All business tables (rfqs, bids, deals, purchases, etc.)
```sql
-- Pattern for all tables
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- ... other columns
);

CREATE INDEX idx_rfqs_org_id ON rfqs(org_id);
```

---

## 🔒 Supabase RLS Policies

### Helper Function
```sql
-- Returns Auth0 sub from JWT
CREATE OR REPLACE FUNCTION current_sub()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE sql STABLE;
```

### RLS Policy Template (Apply to ALL org-scoped tables)
```sql
-- Example: RFQs table
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their org's RFQs"
ON rfqs
FOR SELECT
USING (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = current_sub()
  )
);

CREATE POLICY "Users insert only to their org's RFQs"
ON rfqs
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = current_sub()
  )
);

CREATE POLICY "Users update only their org's RFQs"
ON rfqs
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = current_sub()
  )
);

CREATE POLICY "Users delete only their org's RFQs"
ON rfqs
FOR DELETE
USING (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = current_sub()
  )
);
```

**Apply this pattern to**: rfqs, bids, deals, auctions, auction_bids, purchases, notifications, listings, price_indicators

---

## 📱 PWA Configuration (Phase 7)

### Add PWA Manifest
Create `public/manifest.json`:

```json
{
  "name": "LithiumBuy",
  "short_name": "LithiumBuy",
  "description": "B2B Lithium Trading Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Update index.html
Add to `<head>`:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2563eb">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="LithiumBuy">
<link rel="apple-touch-icon" href="/icon-192.png">
```

### Create Icons
Generate icons at:
- `public/icon-192.png` (192x192px)
- `public/icon-512.png` (512x512px)
- `public/favicon.ico`

Use tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

---

## 🧪 Testing

### Create Test Users in Auth0
1. Go to: https://manage.auth0.com/dashboard/us/dev-vbox82zyf82ityy0/users
2. Click "Create User"
3. Create these test users:

**Buyer User**
```
Email: buyer@test.com
Password: Test123!@#
Connection: Username-Password-Authentication
```

**Supplier User**
```
Email: supplier@test.com
Password: Test123!@#
Connection: Username-Password-Authentication
```

**Multi-Org User**
```
Email: multi@test.com
Password: Test123!@#
Connection: Username-Password-Authentication
```

### Create Test Organizations in Supabase
```sql
-- Insert test organizations
INSERT INTO organizations (id, name, type, email) VALUES
('11111111-1111-1111-1111-111111111111', 'Tesla', 'buyer', 'procurement@tesla.com'),
('22222222-2222-2222-2222-222222222222', 'Albemarle', 'supplier', 'sales@albemarle.com'),
('33333333-3333-3333-3333-333333333333', 'Rio Tinto', 'buyer', 'purchasing@riotinto.com');

-- Link test users to organizations
-- Note: Replace 'auth0|...' with actual Auth0 user IDs after creating users
INSERT INTO org_members (org_id, user_id, role) VALUES
('11111111-1111-1111-1111-111111111111', 'auth0|buyer-user-id', 'owner'),
('22222222-2222-2222-2222-222222222222', 'auth0|supplier-user-id', 'owner'),
('11111111-1111-1111-1111-111111111111', 'auth0|multi-user-id', 'admin'),
('33333333-3333-3333-3333-333333333333', 'auth0|multi-user-id', 'admin');
```

### Test Checklist
- [ ] Login with buyer@test.com → See Tesla org → Dashboard loads
- [ ] Login with supplier@test.com → See Albemarle org → Dashboard loads
- [ ] Login with multi@test.com → See dropdown [Tesla ▼] [Rio Tinto]
- [ ] Switch org → Data updates to new org
- [ ] Logout → Redirects to landing page
- [ ] Refresh page while logged in → Stay logged in (session persists)
- [ ] Create RFQ as buyer → Only visible to buyer's org
- [ ] Submit bid as supplier → Only visible to supplier's org

---

## 🎯 AI Assistant Implementation Prompt

Copy and paste this into Cursor, Claude, Windsurf, or Copilot:

```
I need you to verify and complete the Auth0 + multi-tenant setup for my LithiumBuy React application.

PROJECT CONTEXT:
- App: LithiumBuy (B2B lithium marketplace)
- Tech: React 18 + Vite + TypeScript + Supabase + TailwindCSS
- Auth: Auth0 (Single Page Application)
- Architecture: Multi-tenant with organization-based access control

AUTH0 CREDENTIALS:
- Domain: dev-vbox82zyf82ityy0.us.auth0.com
- Client ID: YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW

PHASES COMPLETED (1-4):
✅ Auth0 SDK + AuthContext
✅ OrganizationContext with org switching
✅ Protected routes with auth/org guards
✅ Auth page with SSO
✅ Onboarding page (create/join org)
✅ Organizations service + hooks (5 RPCs)
✅ Purchases service + hooks (4 RPCs)
✅ Purchases page with PO listing
✅ Team page with invite dialog
✅ OrgSwitcher + UserMenu components
✅ Authenticated Supabase client

REMAINING TASKS:

Phase 5: Multi-Tenant Updates (2 hours)
- [ ] Update NotificationContext to use real backend RPCs
- [ ] Create useRealtimeSubscription hook for live updates
- [ ] Add realtime to: useRFQs, useBids, useDeals, useAuctions, usePurchases
- [ ] Update Dashboard with real org-scoped data (no mock data)

Phase 6: Action Forms (1.5 hours)
- [ ] Create CreateRFQDialog component
- [ ] Add "Create RFQ" button to RFQs page
- [ ] Create SubmitBidForm component
- [ ] Add "Submit Bid" button to RFQ detail page
- [ ] Create DealResponseButtons component (Accept/Reject)
- [ ] Add response buttons to Deal detail page
- [ ] Create AwardDealButton component
- [ ] Add "Award Deal" button to Bids list

Phase 7: Cleanup & PWA (30 min)
- [ ] Archive legacy services to src/services/_legacy/
- [ ] Create public/manifest.json for PWA
- [ ] Add PWA meta tags to index.html
- [ ] Generate PWA icons (192x192, 512x512)
- [ ] Fix TypeScript errors (npm run type-check)
- [ ] Test production build (npm run build)

IMPLEMENTATION REQUIREMENTS:

1. All data hooks MUST filter by currentOrg.id:
   - const { currentOrg } = useOrganization();
   - All queries: WHERE org_id = currentOrg.id

2. All mutations MUST inject currentOrg.id:
   - const { currentOrg } = useOrganization();
   - createRfq({ ...data, org_id: currentOrg.id })

3. All forms MUST validate with zod schemas

4. All components MUST use TailwindCSS (match existing design)

5. All async operations MUST show loading states

6. All errors MUST show toast notifications

7. Realtime subscriptions MUST filter by org_id:
   - filter: `org_id=eq.${currentOrg.id}`

8. Action buttons MUST check user role:
   - Buyers: Create RFQ, Award Deal, Create Purchase
   - Suppliers: Submit Bid, Accept/Reject Deal

9. PWA MUST work offline (cache static assets)

10. Type safety: Use generated types from src/types/supabase.ts

REFERENCE FILES:
- Architecture: LITHIUMBUY_AUTH_SETUP.md
- Complete Plan: MVP_COMPLETE_PLAN.md
- Quick Start: QUICK_START.md
- API Reference: SKILLS.md

Please implement Phases 5-7 following these requirements. Ensure all components are production-ready with proper error handling, loading states, and TypeScript types.
```

---

## 📚 Reference Documents

- **Complete Plan**: `MVP_COMPLETE_PLAN.md` - Detailed phase-by-phase implementation
- **Quick Start**: `QUICK_START.md` - 30-minute setup guide
- **API Reference**: `SKILLS.md` - All RPC functions with TypeScript signatures
- **Status Tracker**: `MVP_STATUS.md` - Phase completion checkboxes

---

## 🚢 Deployment

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Production)
Add to Netlify/Vercel dashboard:
```
VITE_AUTH0_DOMAIN=dev-vbox82zyf82ityy0.us.auth0.com
VITE_AUTH0_CLIENT_ID=YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW
VITE_AUTH0_AUDIENCE=https://api.lithiumbuy.com
VITE_AUTH0_CALLBACK_URL=https://lithiumbuy.com/callback
VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Update Auth0 Callback URLs:
```
https://lithiumbuy.com/callback
https://www.lithiumbuy.com/callback
```

---

## ✅ Success Criteria

### Phase 5 Complete
- [ ] Notifications load from backend RPC
- [ ] Real-time updates work on all pages
- [ ] Dashboard shows real org-level KPIs
- [ ] No mock data anywhere

### Phase 6 Complete
- [ ] Buyers can create RFQs
- [ ] Suppliers can submit bids
- [ ] Suppliers can accept/reject deals
- [ ] Buyers can award deals to bids
- [ ] All forms validate properly

### Phase 7 Complete
- [ ] PWA manifest exists
- [ ] App installable on mobile
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Deployed to production

---

## 🎉 You're Ready!

Your LithiumBuy multi-tenant platform is now configured for Auth0 authentication with full organization isolation. Follow the AI Assistant Implementation Prompt above to complete Phases 5-7.

**Architecture Summary**:
- ✅ Single PWA serving all organizations
- ✅ Auth0 SSO with JWT tokens
- ✅ Supabase RLS enforcing org isolation
- ✅ Real-time multi-tenant data sync
- ✅ Mobile-ready (responsive + PWA)
- ✅ Offline-capable (with service worker)

**Ready to ship!** 🚀
