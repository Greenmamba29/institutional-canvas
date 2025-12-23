-- =========================================
-- LithiumBuy Domain Core: RFQs, Deals, Auctions, Bids, Notifications, Price Indicators
-- Project: vuekwckknfjivjighhfd
-- =========================================

-- Extensions (safe if already installed)
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- -----------------------------
-- JWT / Auth Helpers
-- -----------------------------
create or replace function public.jwt_claim(claim text)
returns text
language sql
stable
as $$
  select (current_setting('request.jwt.claims', true)::json ->> claim);
$$;

-- Expect Auth0 to inject org_id claim under either:
-- 1) "org_id" OR
-- 2) a namespaced claim like "https://lithiumbuy.com/org_id"
create or replace function public.jwt_org_id()
returns uuid
language plpgsql
stable
as $$
declare
  v text;
begin
  v := public.jwt_claim('org_id');
  if v is null or v = '' then
    v := public.jwt_claim('https://lithiumbuy.com/org_id');
  end if;

  if v is null or v = '' then
    return null;
  end if;

  return v::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.jwt_user_id()
returns uuid
language plpgsql
stable
as $$
declare
  v text;
begin
  -- If using Supabase native auth, auth.uid() works.
  -- If using Auth0 + external JWT, you may also have a claim.
  v := public.jwt_claim('user_id');
  if v is null or v = '' then
    v := public.jwt_claim('https://lithiumbuy.com/user_id');
  end if;

  if v is not null and v <> '' then
    return v::uuid;
  end if;

  return auth.uid();
exception when others then
  return auth.uid();
end;
$$;

-- -----------------------------
-- Enums
-- -----------------------------
do $$ begin
  create type public.rfq_status as enum ('draft','submitted','closed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deal_status as enum ('pending','active','rejected','expired','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.offer_decision as enum ('accepted','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.auction_status as enum ('scheduled','live','ended','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'rfq_submitted',
    'rfq_awarded',
    'deal_created',
    'deal_offer_response',
    'auction_bid_placed',
    'auction_won',
    'system'
  );
exception when duplicate_object then null; end $$;

-- -----------------------------
-- Tables
-- -----------------------------

-- RFQs (Request for Quote / Proposal)
create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  created_by uuid not null,
  title text not null,
  description text,
  product_id uuid null, -- link to products if applicable
  target_quantity numeric,
  target_unit text,
  incoterms text,
  delivery_location text,
  status public.rfq_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rfqs_org_id_idx on public.rfqs(org_id);
create index if not exists rfqs_status_idx on public.rfqs(status);

-- Deals (created when buyer awards an RFQ or starts a purchase flow)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,               -- buyer org
  buyer_user_id uuid not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  rfq_id uuid null references public.rfqs(id) on delete set null,
  title text not null,
  status public.deal_status not null default 'pending',
  offer_decision public.offer_decision null, -- supplier accept/reject
  offer_decision_at timestamptz null,
  offer_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deals_org_id_idx on public.deals(org_id);
create index if not exists deals_supplier_id_idx on public.deals(supplier_id);
create index if not exists deals_status_idx on public.deals(status);

-- Bids (supplier bids on RFQs)
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null, -- supplier org (or supplier's org)
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  created_by uuid not null,
  price numeric not null,
  currency text not null default 'USD',
  quantity numeric,
  lead_time_days integer,
  notes text,
  is_withdrawn boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bids_rfq_id_idx on public.bids(rfq_id);
create index if not exists bids_supplier_id_idx on public.bids(supplier_id);

-- Auctions
create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null, -- owner org (seller/market operator)
  created_by uuid not null,
  title text not null,
  description text,
  product_id uuid null references public.products(id) on delete set null,
  status public.auction_status not null default 'scheduled',
  starts_at timestamptz null,
  ends_at timestamptz null,
  reserve_price numeric null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auctions_status_idx on public.auctions(status);
create index if not exists auctions_org_id_idx on public.auctions(org_id);

-- Auction bids
create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  org_id uuid not null, -- bidder org
  created_by uuid not null,
  amount numeric not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create index if not exists auction_bids_auction_id_idx on public.auction_bids(auction_id);
create index if not exists auction_bids_org_id_idx on public.auction_bids(org_id);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid null, -- optional: targeted user
  type public.notification_type not null default 'system',
  title text not null,
  body text,
  entity_type text null,
  entity_id uuid null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists notifications_org_id_idx on public.notifications(org_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);

-- Price Indicators (SPOT.ai / market intel)
create table if not exists public.price_indicators (
  id uuid primary key default gen_random_uuid(),
  symbol text not null, -- e.g. LITHIUM_CARBONATE_BATTERY_GRADE
  region text not null, -- e.g. CN, US, EU
  price numeric not null,
  currency text not null default 'USD',
  unit text not null, -- e.g. USD/MT
  observed_at timestamptz not null default now(),
  source text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists price_indicators_symbol_idx on public.price_indicators(symbol);
create index if not exists price_indicators_region_idx on public.price_indicators(region);
create index if not exists price_indicators_observed_at_idx on public.price_indicators(observed_at);

-- -----------------------------
-- Updated-at triggers (optional minimal)
-- -----------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$ begin
  create trigger trg_rfqs_updated_at before update on public.rfqs
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_bids_updated_at before update on public.bids
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_auctions_updated_at before update on public.auctions
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- -----------------------------
-- RLS
-- -----------------------------
alter table public.rfqs enable row level security;
alter table public.deals enable row level security;
alter table public.bids enable row level security;
alter table public.auctions enable row level security;
alter table public.auction_bids enable row level security;
alter table public.notifications enable row level security;
alter table public.price_indicators enable row level security;

-- Rule: Org isolation for reads
-- If jwt_org_id() is null, this policy will deny by default.
create policy if not exists rfqs_select_org
on public.rfqs for select
using (org_id = public.jwt_org_id());

create policy if not exists deals_select_org
on public.deals for select
using (org_id = public.jwt_org_id());

create policy if not exists bids_select_org
on public.bids for select
using (org_id = public.jwt_org_id());

create policy if not exists auctions_select_org
on public.auctions for select
using (org_id = public.jwt_org_id());

create policy if not exists auction_bids_select_org
on public.auction_bids for select
using (org_id = public.jwt_org_id());

create policy if not exists notifications_select_org
on public.notifications for select
using (org_id = public.jwt_org_id());

-- price indicators: readable by any authenticated org (or optionally pro-tier only later)
create policy if not exists price_indicators_select_all
on public.price_indicators for select
using (public.jwt_user_id() is not null);

-- Writes: only through RPC (security definer), so lock down direct mutations:
revoke insert, update, delete on public.rfqs from anon, authenticated;
revoke insert, update, delete on public.deals from anon, authenticated;
revoke insert, update, delete on public.bids from anon, authenticated;
revoke insert, update, delete on public.auctions from anon, authenticated;
revoke insert, update, delete on public.auction_bids from anon, authenticated;
revoke insert, update, delete on public.notifications from anon, authenticated;

-- -----------------------------
-- RPC Functions (SECURITY DEFINER) — Lovable calls these, not direct mutations
-- -----------------------------

-- RFQs
create or replace function public.create_rfq(
  p_title text,
  p_description text,
  p_product_id uuid,
  p_target_quantity numeric,
  p_target_unit text,
  p_incoterms text,
  p_delivery_location text
) returns public.rfqs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_row public.rfqs;
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  insert into public.rfqs(org_id, created_by, title, description, product_id, target_quantity, target_unit, incoterms, delivery_location, status)
  values (v_org, v_user, p_title, p_description, p_product_id, p_target_quantity, p_target_unit, p_incoterms, p_delivery_location, 'submitted')
  returning * into v_row;

  insert into public.notifications(org_id, user_id, type, title, body, entity_type, entity_id)
  values (v_org, v_user, 'rfq_submitted', 'RFQ submitted', p_title, 'rfq', v_row.id);

  return v_row;
end;
$$;

create or replace function public.list_rfqs()
returns setof public.rfqs
language sql
security definer
set search_path = public
as $$
  select * from public.rfqs
  where org_id = public.jwt_org_id()
  order by created_at desc;
$$;

-- Bids
create or replace function public.submit_bid(
  p_rfq_id uuid,
  p_supplier_id uuid,
  p_price numeric,
  p_currency text,
  p_quantity numeric,
  p_lead_time_days int,
  p_notes text
) returns public.bids
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_row public.bids;
  v_rfq public.rfqs;
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  select * into v_rfq from public.rfqs where id = p_rfq_id;
  if not found then raise exception 'RFQ not found'; end if;

  insert into public.bids(org_id, rfq_id, supplier_id, created_by, price, currency, quantity, lead_time_days, notes)
  values (v_org, p_rfq_id, p_supplier_id, v_user, p_price, coalesce(p_currency,'USD'), p_quantity, p_lead_time_days, p_notes)
  returning * into v_row;

  -- notify buyer org (rfq org)
  insert into public.notifications(org_id, type, title, body, entity_type, entity_id)
  values (v_rfq.org_id, 'system', 'New bid received', 'A supplier submitted a bid on your RFQ.', 'rfq', p_rfq_id);

  return v_row;
end;
$$;

create or replace function public.withdraw_bid(p_bid_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  update public.bids
    set is_withdrawn = true
  where id = p_bid_id
    and org_id = v_org;

  return found;
end;
$$;

-- Deals
create or replace function public.create_deal(
  p_supplier_id uuid,
  p_rfq_id uuid,
  p_title text
) returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_row public.deals;
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  insert into public.deals(org_id, buyer_user_id, supplier_id, rfq_id, title, status)
  values (v_org, v_user, p_supplier_id, p_rfq_id, p_title, 'pending')
  returning * into v_row;

  insert into public.notifications(org_id, type, title, body, entity_type, entity_id)
  values (v_org, 'deal_created', 'Deal created', p_title, 'deal', v_row.id);

  return v_row;
end;
$$;

create or replace function public.update_deal_status(
  p_deal_id uuid,
  p_status public.deal_status
) returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
  v_row public.deals;
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  update public.deals
    set status = p_status
  where id = p_deal_id
    and org_id = v_org
  returning * into v_row;

  if not found then raise exception 'Deal not found or not in org'; end if;

  return v_row;
end;
$$;

-- Supplier responds to offer (accept / reject) + notify buyer
create or replace function public.respond_to_offer(
  p_deal_id uuid,
  p_decision public.offer_decision,
  p_note text
) returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public.jwt_user_id();
  v_row public.deals;
begin
  -- suppliers may not share buyer org_id; we only require authenticated user.
  update public.deals
    set offer_decision = p_decision,
        offer_decision_at = now(),
        offer_note = p_note,
        status = case when p_decision = 'accepted' then 'active' else 'rejected' end
  where id = p_deal_id
  returning * into v_row;

  if not found then raise exception 'Deal not found'; end if;

  -- notify buyer org
  insert into public.notifications(org_id, type, title, body, entity_type, entity_id)
  values (
    v_row.org_id,
    'deal_offer_response',
    'Supplier responded to offer',
    case when p_decision = 'accepted'
      then 'Accepted your offer.'
      else 'Rejected your offer.'
    end,
    'deal',
    v_row.id
  );

  return v_row;
end;
$$;

-- Auctions
create or replace function public.list_auctions()
returns setof public.auctions
language sql
security definer
set search_path = public
as $$
  select * from public.auctions
  where status in ('scheduled','live','ended')
  order by coalesce(starts_at, created_at) desc;
$$;

create or replace function public.place_auction_bid(
  p_auction_id uuid,
  p_amount numeric,
  p_currency text
) returns public.auction_bids
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_auc public.auctions;
  v_row public.auction_bids;
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  select * into v_auc from public.auctions where id = p_auction_id;
  if not found then raise exception 'Auction not found'; end if;

  insert into public.auction_bids(auction_id, org_id, created_by, amount, currency)
  values (p_auction_id, v_org, v_user, p_amount, coalesce(p_currency,'USD'))
  returning * into v_row;

  -- notify auction owner org
  insert into public.notifications(org_id, type, title, body, entity_type, entity_id)
  values (v_auc.org_id, 'auction_bid_placed', 'New auction bid', 'A new bid was placed.', 'auction', v_auc.id);

  return v_row;
end;
$$;

-- Notifications
create or replace function public.get_notifications()
returns setof public.notifications
language sql
security definer
set search_path = public
as $$
  select * from public.notifications
  where org_id = public.jwt_org_id()
  order by created_at desc;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;

  update public.notifications
    set is_read = true,
        read_at = now()
  where id = p_notification_id
    and org_id = v_org;

  return found;
end;
$$;

-- Market Intel
create or replace function public.get_price_indicators(
  p_symbol text,
  p_region text,
  p_limit int default 50
) returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_agg(to_jsonb(t))
  from (
    select symbol, region, price, currency, unit, observed_at, source, metadata
    from public.price_indicators
    where (p_symbol is null or symbol = p_symbol)
      and (p_region is null or region = p_region)
    order by observed_at desc
    limit coalesce(p_limit, 50)
  ) t;
$$;

-- Listings (wrappers over existing products table)
create or replace function public.list_listings()
returns setof public.products
language sql
security definer
set search_path = public
as $$
  select * from public.products
  order by created_at desc;
$$;

create or replace function public.get_listing(p_product_id uuid)
returns public.products
language sql
security definer
set search_path = public
as $$
  select * from public.products where id = p_product_id;
$$;