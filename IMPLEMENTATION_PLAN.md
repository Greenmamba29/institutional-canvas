# LithiumBuy MVP Implementation Plan

**Status:** Awaiting Approval
**Date:** 2026-01-01

---

## ✅ Completed

- [x] Daily.co integration configured
  - API key added to `.env`
  - Service created with room management
  - Ready for Vercel deployment (add `VITE_DAILY_API_KEY` to Vercel env vars)

---

## 📋 Tasks Requiring Approval

### Task 1: Create Suppliers, Products, and Reviews Database Schema

**Problem:** The `suppliers`, `products`, `certifications`, `reviews`, and `locations` tables are referenced in the codebase but don't exist in the database migrations.

**Proposed Solution:**

#### 1.1 Create Suppliers Table
```sql
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  legal_name text,
  description text,
  website text,
  verification_tier text default 'unverified' check (verification_tier in ('unverified', 'basic', 'verified', 'premium')),
  logo_url text,
  banner_url text,
  average_rating numeric(3, 2) default 0.00,
  total_reviews integer default 0,
  total_deals integer default 0,
  year_established integer,
  employee_count text,
  annual_capacity_mt integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### 1.2 Create Products Table
```sql
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name text not null,
  description text,
  category text not null, -- 'Lithium Carbonate', 'Lithium Hydroxide', etc.
  grade text, -- 'Battery Grade', 'Industrial Grade', 'Technical Grade'
  purity_percentage numeric(5, 2), -- 99.50
  unit text not null default 'MT', -- Metric Ton
  min_order_quantity numeric,
  lead_time_days integer,
  available_quantity numeric,
  certifications text[], -- ['ISO 9001', 'REACH', 'RoHS']
  esg_compliant boolean default false,
  specifications jsonb default '{}'::jsonb,
  pricing jsonb default '{}'::jsonb, -- { "base_price": 12000, "currency": "USD", "unit": "MT" }
  status text default 'active' check (status in ('active', 'inactive', 'discontinued')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### 1.3 Create Reviews Table
```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  buyer_org_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  verified_purchase boolean default false,
  response text, -- Supplier response to review
  response_at timestamptz,
  helpful_count integer default 0,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### 1.4 Create Certifications Table
```sql
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name text not null, -- 'ISO 9001:2015'
  issuing_body text, -- 'ISO'
  certificate_number text,
  issue_date date,
  expiry_date date,
  document_url text,
  verified boolean default false,
  created_at timestamptz not null default now()
);
```

#### 1.5 Create Locations Table
```sql
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  location_type text not null check (location_type in ('headquarters', 'factory', 'warehouse', 'office')),
  name text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state_province text,
  postal_code text,
  country text not null,
  coordinates jsonb, -- { "lat": 34.052235, "lng": -118.243683 }
  capacity_mt integer,
  created_at timestamptz not null default now()
);
```

#### 1.6 Create Public View for Marketplace
```sql
create or replace view public.suppliers_public as
select
  s.id,
  s.org_id,
  s.display_name,
  s.description,
  s.website,
  s.verification_tier,
  s.logo_url,
  s.banner_url,
  s.average_rating,
  s.total_reviews,
  s.total_deals,
  s.year_established,
  s.employee_count,
  s.annual_capacity_mt,
  s.created_at
from public.suppliers s
where s.verification_tier != 'unverified';
```

#### 1.7 Add RLS Policies
- Suppliers: Public read, org members can update their own
- Products: Public read, suppliers can manage their own
- Reviews: Buyers can create, everyone can read
- Certifications: Public read, suppliers can manage
- Locations: Public read, suppliers can manage

**Estimated Effort:** 2-3 hours
**Risk:** Low (standard CRUD tables)

---

### Task 2: Seed Test Suppliers and Products

**Problem:** Database needs sample data for testing and demo purposes.

**Proposed Solution:**

#### 2.1 Auto-Generate Suppliers from Existing Organizations
- Query organizations table for `org_type = 'supplier'`
- Create supplier records linked to these organizations
- Generate realistic company profiles

#### 2.2 Seed Sample Products
Create 3-5 products per supplier:
- **Lithium Carbonate Battery Grade** (99.5% purity)
- **Lithium Hydroxide Monohydrate** (56.5% LiOH)
- **Lithium Spodumene Concentrate** (6-7% Li2O)
- **Recycled Lithium** (varying grades)

#### 2.3 Sample Data Strategy
```sql
-- Example: Albemarle Corporation supplier
INSERT INTO public.suppliers (org_id, display_name, description, verification_tier, ...)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Albemarle Corporation',
  'Global leader in lithium production with operations across Chile, Australia, and the US...',
  'premium',
  ...
);
```

**Estimated Effort:** 1-2 hours
**Risk:** Low

---

### Task 3: Create and Seed Sample Reviews

**Problem:** Empty reviews make suppliers look untrustworthy. Need realistic demo data.

**Proposed Solution:**

#### 3.1 Review Seeding Strategy
- Generate 3-5 reviews per supplier
- Mix of ratings: 60% (5-star), 20% (4-star), 15% (3-star), 5% (1-2 star)
- Mark all as `verified_purchase = true`
- Link to completed deals where possible
- Realistic comments about:
  - Product quality
  - Delivery timeliness
  - Communication
  - Pricing competitiveness
  - ESG compliance

#### 3.2 Sample Review
```sql
INSERT INTO public.reviews (
  supplier_id,
  buyer_org_id,
  deal_id,
  rating,
  title,
  comment,
  verified_purchase,
  created_by
) VALUES (
  'supplier-uuid',
  '11111111-1111-1111-1111-111111111111', -- Tesla
  'deal-uuid',
  5,
  'Excellent quality and on-time delivery',
  'Ordered 100MT of battery-grade lithium carbonate. Product exceeded 99.5% purity specifications. Delivery was on schedule, and their ESG documentation was thorough. Would recommend for large-scale EV battery production.',
  true,
  'buyer-user-id'
);
```

#### 3.3 Supplier Responses (Optional)
Add responses from suppliers to 30-40% of reviews to show engagement.

**Estimated Effort:** 1 hour
**Risk:** Low

---

### Task 4: Configure Test Users with Real Auth IDs

**Problem:** `seed.sql` has placeholders like `'auth0|buyer_test_user'` instead of real user IDs.

**Proposed Solution:**

#### Option A: Use Supabase Auth (Recommended for MVP)
1. Create 2 test users via Supabase Auth UI
2. Get their UUIDs from `auth.users` table
3. Update seed.sql with real UUIDs
4. Simplify auth flow (no Auth0 dependency for testing)

**Steps:**
```sql
-- 1. Create users via Supabase Dashboard or SQL
INSERT INTO auth.users (email, encrypted_password, ...)
VALUES ('buyer@test.com', ...), ('supplier@test.com', ...);

-- 2. Get UUIDs
SELECT id, email FROM auth.users WHERE email IN ('buyer@test.com', 'supplier@test.com');

-- 3. Update seed.sql
INSERT INTO public.org_members (org_id, user_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', '<buyer-uuid>', 'owner'),
  ('22222222-2222-2222-2222-222222222222', '<supplier-uuid>', 'owner');
```

#### Option B: Use Auth0 (Current Setup)
1. Create 2 users in Auth0 dashboard
2. Copy their `sub` values (e.g., `auth0|67890abc...`)
3. Update seed.sql
4. Configure Auth0 Action for `org_id` claim

**Recommendation:** Use Option A (Supabase Auth) for faster MVP iteration.

**Estimated Effort:** 30 minutes
**Risk:** Very Low

---

### Task 5: Update Vercel Environment Variables

**Problem:** Daily.co API key needs to be added to production environment.

**Proposed Solution:**

#### 5.1 Add to Vercel
1. Go to https://vercel.com → Project Settings → Environment Variables
2. Add: `VITE_DAILY_API_KEY` = `b62b6f9af193c560f71aafe03b37dee0c79f01ba86635a0ea26815c4af517a2b`
3. Scope: Production, Preview, Development
4. Redeploy

#### 5.2 Verify
- Check that `import.meta.env.VITE_DAILY_API_KEY` is available in production
- Test video room creation on production deployment

**Estimated Effort:** 5 minutes
**Risk:** Very Low

---

### Task 6: Simplify ElevenLabs Agent Setup (3 Agents Only)

**Problem:** Currently configured for 24 agents (12 languages × 2 roles), but only 3 are needed.

**Proposed Solution:**

#### 6.1 Identify Required Agents
Please specify which 3 agents you need:
- **Option 1:** 1 Buyer (English), 1 Supplier (English), 1 Multi-purpose
- **Option 2:** 1 Buyer (English), 1 Supplier (English), 1 Buyer (Chinese)
- **Option 3:** Other combination?

#### 6.2 Simplify Deployment Script
- Update `deploy.mjs` to create only the 3 specified agents
- Remove multi-language complexity
- Simpler voice configuration

#### 6.3 Update Documentation
- Revise `AGENT_ARCHITECTURE.md` to reflect 3-agent setup
- Update `DEPLOYMENT.md` with simplified instructions

**Estimated Effort:** 1 hour
**Risk:** Low
**Requires:** Your input on which 3 agents to create

---

## 📊 Summary

| Task | Effort | Risk | Status |
|------|--------|------|--------|
| 1. Database Schema (Suppliers/Products/Reviews) | 2-3h | Low | ⏳ Awaiting Approval |
| 2. Seed Suppliers & Products | 1-2h | Low | ⏳ Awaiting Approval |
| 3. Seed Sample Reviews | 1h | Low | ⏳ Awaiting Approval |
| 4. Configure Test Users | 30m | Very Low | ⏳ Awaiting Approval |
| 5. Vercel Environment Variables | 5m | Very Low | ⏳ Awaiting Approval |
| 6. Simplify ElevenLabs (3 agents) | 1h | Low | ⏳ Requires Input |

**Total Estimated Effort:** 5-7 hours

---

## 🎯 Execution Order

**Phase 1: Database Foundation**
1. Task 1: Create database schema
2. Task 4: Configure test users
3. Task 2: Seed suppliers & products
4. Task 3: Seed reviews

**Phase 2: Deployment Configuration**
5. Task 5: Update Vercel environment variables
6. Task 6: Simplify ElevenLabs setup (pending your input)

---

## ❓ Questions for You

Before proceeding, please confirm:

1. **Approve database schema?** (Task 1)
   - [ ] Approve as proposed
   - [ ] Request changes (please specify)

2. **Seeding strategy?** (Tasks 2 & 3)
   - [ ] Auto-generate suppliers from organizations table
   - [ ] Manually provide supplier data
   - [ ] Skip seeding (use real data)

3. **Review seeding?** (Task 3)
   - [ ] Generate sample reviews (3-5 per supplier)
   - [ ] Leave empty for user-generated only

4. **Test users?** (Task 4)
   - [ ] Use Supabase Auth (recommended)
   - [ ] Use Auth0 (current setup)

5. **Which 3 ElevenLabs agents?** (Task 6)
   - [ ] 1 Buyer (EN), 1 Supplier (EN), 1 ______
   - [ ] Other: ____________

6. **Execution priority?**
   - [ ] Execute all tasks in order
   - [ ] Prioritize: ____________
   - [ ] Deprioritize: ____________

---

## 📝 Notes

- Daily.co integration is **complete** and committed
- All code is on branch: `claude/add-lithium-buy-agent-ILHmu`
- Ready to execute tasks upon your approval
