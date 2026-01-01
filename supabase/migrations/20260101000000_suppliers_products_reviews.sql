-- =========================================
-- LithiumBuy: Suppliers, Products, Reviews, Certifications, Locations
-- Real lithium market data structure
-- =========================================

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- =========================================
-- 1) SUPPLIERS TABLE
-- =========================================
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,

  -- Company Information
  display_name text not null,
  legal_name text,
  description text,
  website text,
  email text,
  phone text,

  -- Verification & Trust
  verification_tier text not null default 'unverified'
    check (verification_tier in ('unverified', 'basic', 'verified', 'premium')),
  verification_date timestamptz,

  -- Media
  logo_url text,
  banner_url text,

  -- Ratings & Statistics
  average_rating numeric(3, 2) default 0.00 check (average_rating >= 0 and average_rating <= 5),
  total_reviews integer default 0 check (total_reviews >= 0),
  total_deals integer default 0 check (total_deals >= 0),

  -- Company Details
  year_established integer check (year_established >= 1800 and year_established <= extract(year from now())),
  employee_count text, -- '1-50', '51-200', '201-500', '501-1000', '1000+'
  annual_capacity_mt integer check (annual_capacity_mt >= 0), -- Metric tons

  -- Compliance & ESG
  esg_certified boolean default false,
  iso_certified boolean default false,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index suppliers_org_id_idx on public.suppliers(org_id);
create index suppliers_verification_tier_idx on public.suppliers(verification_tier);
create index suppliers_average_rating_idx on public.suppliers(average_rating desc);
create index suppliers_display_name_idx on public.suppliers using gin(display_name gin_trgm_ops);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- =========================================
-- 2) PRODUCTS TABLE
-- =========================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,

  -- Product Information
  name text not null,
  description text,

  -- Classification
  category text not null check (category in (
    'Lithium Carbonate',
    'Lithium Hydroxide',
    'Lithium Spodumene',
    'Lithium Chloride',
    'Recycled Lithium',
    'Other'
  )),
  grade text check (grade in (
    'Battery Grade',
    'Industrial Grade',
    'Technical Grade',
    'Pharmaceutical Grade'
  )),

  -- Specifications (based on real industry standards)
  purity_percentage numeric(5, 2) check (purity_percentage >= 90 and purity_percentage <= 100), -- 99.50%, 99.90%
  li2co3_content numeric(5, 2), -- For carbonate products
  lioh_content numeric(5, 2), -- For hydroxide products
  li2o_content numeric(5, 2), -- For spodumene concentrate

  -- Physical Properties
  particle_size_um text, -- '10-50', '50-100', custom range
  bulk_density text, -- g/cm³
  moisture_content numeric(4, 2), -- Percentage

  -- Ordering
  unit text not null default 'MT', -- MT (Metric Ton), kg
  min_order_quantity numeric check (min_order_quantity > 0),
  lead_time_days integer check (lead_time_days >= 0),
  available_quantity numeric check (available_quantity >= 0),

  -- Compliance
  certifications text[], -- ['ISO 9001:2015', 'REACH', 'RoHS', 'IATF 16949']
  esg_compliant boolean default false,
  conflict_free boolean default true,

  -- Detailed Specifications (JSON)
  specifications jsonb default '{}'::jsonb,
  -- Example: {"Na": "≤0.0001%", "Mg": "≤0.0001%", "Ca": "≤0.0001%", "Fe": "≤0.0001%"}

  -- Pricing
  pricing jsonb default '{}'::jsonb,
  -- Example: {"base_price": 12000, "currency": "USD", "unit": "MT", "incoterms": "FOB", "volume_discounts": [...]}

  -- Status
  status text not null default 'active' check (status in ('active', 'inactive', 'discontinued', 'out_of_stock')),

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_supplier_id_idx on public.products(supplier_id);
create index products_category_idx on public.products(category);
create index products_grade_idx on public.products(grade);
create index products_status_idx on public.products(status);
create index products_esg_compliant_idx on public.products(esg_compliant);
create index products_name_idx on public.products using gin(name gin_trgm_ops);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =========================================
-- 3) CERTIFICATIONS TABLE
-- =========================================
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,

  -- Certification Details
  name text not null, -- 'ISO 9001:2015', 'IATF 16949', 'ISO 14001'
  certificate_type text check (certificate_type in (
    'Quality Management',
    'Environmental',
    'Safety',
    'Industry Specific',
    'Product Specific',
    'Other'
  )),
  issuing_body text, -- 'ISO', 'UL', 'TÜV', 'SGS'
  certificate_number text,

  -- Validity
  issue_date date,
  expiry_date date,

  -- Verification
  document_url text,
  verified boolean default false,
  verified_by uuid, -- User who verified
  verified_at timestamptz,

  -- Timestamps
  created_at timestamptz not null default now()
);

create index certifications_supplier_id_idx on public.certifications(supplier_id);
create index certifications_expiry_date_idx on public.certifications(expiry_date)
  where expiry_date is not null;
create index certifications_verified_idx on public.certifications(verified);

-- =========================================
-- 4) LOCATIONS TABLE
-- =========================================
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,

  -- Location Type
  location_type text not null check (location_type in (
    'headquarters',
    'mining_operation',
    'processing_plant',
    'warehouse',
    'office',
    'r_and_d_center'
  )),

  -- Facility Information
  name text, -- 'Atacama Salt Flat', 'Greenbushes Mine', 'Kwinana Refinery'
  description text,

  -- Address
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state_province text,
  postal_code text,
  country text not null,

  -- Geo coordinates
  latitude numeric(10, 7),
  longitude numeric(10, 7),

  -- Capacity
  capacity_mt integer, -- Annual capacity in metric tons
  operational_since integer check (operational_since >= 1800),

  -- Contact
  phone text,
  email text,

  -- Timestamps
  created_at timestamptz not null default now()
);

create index locations_supplier_id_idx on public.locations(supplier_id);
create index locations_location_type_idx on public.locations(location_type);
create index locations_country_idx on public.locations(country);

-- =========================================
-- 5) REVIEWS TABLE
-- =========================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  buyer_org_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,

  -- Review Content
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text not null,

  -- Verification
  verified_purchase boolean default false,

  -- Supplier Response
  response text,
  response_at timestamptz,
  responded_by uuid, -- User who responded

  -- Engagement
  helpful_count integer default 0 check (helpful_count >= 0),

  -- Creator
  created_by uuid not null, -- Supabase Auth user ID

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_supplier_id_idx on public.reviews(supplier_id);
create index reviews_buyer_org_id_idx on public.reviews(buyer_org_id);
create index reviews_deal_id_idx on public.reviews(deal_id);
create index reviews_rating_idx on public.reviews(rating);
create index reviews_verified_purchase_idx on public.reviews(verified_purchase);
create index reviews_created_at_idx on public.reviews(created_at desc);

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- =========================================
-- 6) PUBLIC VIEW FOR MARKETPLACE
-- =========================================
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
  s.esg_certified,
  s.iso_certified,
  s.created_at
from public.suppliers s
where s.verification_tier != 'unverified';

-- =========================================
-- 7) RLS POLICIES
-- =========================================

-- Suppliers: Public read, org members can update their own
alter table public.suppliers enable row level security;

create policy suppliers_select_all on public.suppliers
  for select using (true);

create policy suppliers_update_own on public.suppliers
  for update using (
    exists (
      select 1 from public.org_members m
      where m.org_id = suppliers.org_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

-- Products: Public read, suppliers can manage their own
alter table public.products enable row level security;

create policy products_select_all on public.products
  for select using (true);

create policy products_insert_own on public.products
  for insert with check (
    exists (
      select 1 from public.suppliers s
      join public.org_members m on m.org_id = s.org_id
      where s.id = products.supplier_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

create policy products_update_own on public.products
  for update using (
    exists (
      select 1 from public.suppliers s
      join public.org_members m on m.org_id = s.org_id
      where s.id = products.supplier_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

create policy products_delete_own on public.products
  for delete using (
    exists (
      select 1 from public.suppliers s
      join public.org_members m on m.org_id = s.org_id
      where s.id = products.supplier_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

-- Reviews: Buyers can create, everyone can read
alter table public.reviews enable row level security;

create policy reviews_select_all on public.reviews
  for select using (true);

create policy reviews_insert_buyers on public.reviews
  for insert with check (
    exists (
      select 1 from public.org_members m
      where m.org_id = reviews.buyer_org_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

create policy reviews_update_own on public.reviews
  for update using (created_by = auth.uid());

-- Certifications: Public read, suppliers can manage
alter table public.certifications enable row level security;

create policy certifications_select_all on public.certifications
  for select using (true);

create policy certifications_insert_own on public.certifications
  for insert with check (
    exists (
      select 1 from public.suppliers s
      join public.org_members m on m.org_id = s.org_id
      where s.id = certifications.supplier_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

-- Locations: Public read, suppliers can manage
alter table public.locations enable row level security;

create policy locations_select_all on public.locations
  for select using (true);

create policy locations_insert_own on public.locations
  for insert with check (
    exists (
      select 1 from public.suppliers s
      join public.org_members m on m.org_id = s.org_id
      where s.id = locations.supplier_id
        and m.user_id = auth.uid()::text
        and m.status = 'active'
    )
  );

-- =========================================
-- 8) HELPER FUNCTION: Update Supplier Stats
-- =========================================
create or replace function public.update_supplier_stats(p_supplier_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.suppliers
  set
    average_rating = (
      select avg(rating)
      from public.reviews
      where supplier_id = p_supplier_id
    ),
    total_reviews = (
      select count(*)
      from public.reviews
      where supplier_id = p_supplier_id
    ),
    total_deals = (
      select count(*)
      from public.deals
      where supplier_id = p_supplier_id
        and status = 'completed'
    )
  where id = p_supplier_id;
end;
$$;

-- Trigger to update stats when review is added
create or replace function public.trg_review_stats()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    perform public.update_supplier_stats(new.supplier_id);
  elsif tg_op = 'DELETE' then
    perform public.update_supplier_stats(old.supplier_id);
  end if;
  return null;
end;
$$;

create trigger trg_reviews_update_stats
  after insert or update or delete on public.reviews
  for each row execute function public.trg_review_stats();
