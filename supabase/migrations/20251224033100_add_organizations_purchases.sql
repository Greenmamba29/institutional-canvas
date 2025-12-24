-- =========================================
-- Organizations, Org Members, and Purchase Orders
-- Integrates with existing suppliers table
-- =========================================

create extension if not exists pgcrypto;

-- =========================================
-- 1) Organizations table
-- =========================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  org_type text not null check (org_type in ('buyer','supplier','admin','partner')),
  name text not null,
  status text not null default 'active',
  email text,
  phone text,
  address jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_org_type_idx on public.organizations(org_type);
create index if not exists organizations_status_idx on public.organizations(status);

-- Enable RLS
alter table public.organizations enable row level security;

-- Policy: authenticated users can read all organizations
do $$ begin
  drop policy if exists organizations_select_all on public.organizations;
  create policy organizations_select_all on public.organizations
    for select using (auth.uid() is not null);
exception when others then null; end $$;

-- Lock down direct mutations
revoke insert, update, delete on public.organizations from anon, authenticated;

-- =========================================
-- 2) Org Members table (multi-user orgs)
-- =========================================
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id text not null, -- Auth0 sub
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  invited_by uuid, -- references org_members(id)
  invited_at timestamptz,
  joined_at timestamptz default now(),
  status text not null default 'active' check (status in ('active','inactive','pending')),
  created_at timestamptz not null default now()
);

create index if not exists org_members_org_id_idx on public.org_members(org_id);
create index if not exists org_members_user_id_idx on public.org_members(user_id);
create index if not exists org_members_status_idx on public.org_members(status);
create unique index if not exists org_members_unique_membership on public.org_members(org_id, user_id);

-- Enable RLS
alter table public.org_members enable row level security;

-- Policy: users can read their own memberships
do $$ begin
  drop policy if exists org_members_select_own on public.org_members;
  create policy org_members_select_own on public.org_members
    for select using (user_id = public.jwt_user_id()::text or user_id = public.current_sub());
exception when others then null; end $$;

-- Lock down direct mutations
revoke insert, update, delete on public.org_members from anon, authenticated;

-- =========================================
-- 3) Link existing suppliers to organizations
-- =========================================
-- Add org_id column to suppliers if it doesn't already exist as FK to organizations
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='suppliers' and column_name='organization_id'
  ) then
    alter table public.suppliers add column organization_id uuid references public.organizations(id) on delete set null;
    create index if not exists suppliers_organization_id_idx on public.suppliers(organization_id);
  end if;
end
$$;

-- =========================================
-- 4) Purchases table (Purchase Orders)
-- =========================================
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_id text not null unique, -- PO-2025-000001
  buyer_org_id uuid not null references public.organizations(id) on delete restrict,
  supplier_org_id uuid not null references public.organizations(id) on delete restrict,
  deal_id uuid references public.deals(id) on delete set null, -- Optional link to deal
  status text not null default 'pending' check (status in ('pending','accepted','rejected','paid','shipped','delivered','cancelled')),
  total_amount numeric,
  currency text default 'USD',
  payload jsonb not null default '{}'::jsonb, -- Line items, terms, etc.
  notes text,
  created_by uuid not null, -- user who created PO
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_buyer_org_id_idx on public.purchases(buyer_org_id);
create index if not exists purchases_supplier_org_id_idx on public.purchases(supplier_org_id);
create index if not exists purchases_status_idx on public.purchases(status);
create index if not exists purchases_deal_id_idx on public.purchases(deal_id);
create index if not exists purchases_purchase_id_idx on public.purchases(purchase_id);

-- Updated-at trigger
do $$ begin
  create trigger trg_purchases_updated_at before update on public.purchases
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- Enable RLS
alter table public.purchases enable row level security;

-- Policy: org members can read their org's purchases
do $$ begin
  drop policy if exists purchases_select_org_members on public.purchases;
  create policy purchases_select_org_members on public.purchases
    for select using (
      exists (
        select 1 from public.org_members m
        where m.user_id = public.jwt_user_id()::text
          and m.org_id in (buyer_org_id, supplier_org_id)
          and m.status = 'active'
      )
    );
exception when others then null; end $$;

-- Lock down direct mutations
revoke insert, update, delete on public.purchases from anon, authenticated;

-- =========================================
-- 5) PO Number Sequence
-- =========================================
do $$
begin
  if not exists (
    select 1 from pg_class where relkind='S' and relname='po_number_seq'
  ) then
    create sequence public.po_number_seq start with 1 increment by 1 cache 1;
  end if;
end
$$;

-- =========================================
-- 6) Helper: current_sub() for Auth0
-- =========================================
create or replace function public.current_sub()
returns text
language sql
stable
as $$
  select (current_setting('request.jwt.claims', true)::json ->> 'sub')
$$;

-- =========================================
-- 7) RPC: create_organization
-- =========================================
create or replace function public.create_organization(
  p_org_type text,
  p_name text,
  p_email text default null,
  p_phone text default null
) returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public.jwt_user_id();
  v_sub text := public.current_sub();
  v_org public.organizations;
begin
  if v_user is null and v_sub is null then
    raise exception 'Authentication required';
  end if;

  insert into public.organizations (org_type, name, email, phone, status)
  values (p_org_type, p_name, p_email, p_phone, 'active')
  returning * into v_org;

  -- Automatically add creator as owner
  insert into public.org_members (org_id, user_id, role, status)
  values (v_org.id, coalesce(v_sub, v_user::text), 'owner', 'active');

  return v_org;
end;
$$;

-- =========================================
-- 8) RPC: invite_org_member
-- =========================================
create or replace function public.invite_org_member(
  p_org_id uuid,
  p_user_email text,
  p_role text default 'member'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_is_admin boolean;
  v_invite_token text;
begin
  -- Check if caller is admin/owner of org
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id
      and user_id = v_user_id
      and role in ('owner','admin')
      and status = 'active'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not authorized to invite members';
  end if;

  -- Generate invite token
  v_invite_token := encode(gen_random_bytes(32), 'hex');

  -- Store invite (you'll need an invites table, or use metadata)
  -- For now, return token and email for external handling
  return jsonb_build_object(
    'invite_token', v_invite_token,
    'org_id', p_org_id,
    'email', p_user_email,
    'role', p_role,
    'invited_by', v_user_id,
    'expires_at', now() + interval '7 days'
  );
end;
$$;

-- =========================================
-- 9) RPC: claim_org_membership (supplier onboarding)
-- =========================================
create or replace function public.claim_org_membership(
  p_org_id uuid,
  p_invite_token text default null
) returns public.org_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_row public.org_members;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- TODO: Validate invite_token if provided (check invites table)
  
  -- Check if already a member
  if exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = v_user_id
  ) then
    raise exception 'Already a member of this organization';
  end if;

  -- Add as member
  insert into public.org_members (org_id, user_id, role, status)
  values (p_org_id, v_user_id, 'member', 'active')
  returning * into v_row;

  return v_row;
end;
$$;

-- =========================================
-- 10) RPC: create_purchase
-- =========================================
create or replace function public.create_purchase(
  p_buyer_org_id uuid,
  p_supplier_org_id uuid,
  p_deal_id uuid default null,
  p_total_amount numeric default null,
  p_currency text default 'USD',
  p_payload jsonb default '{}'::jsonb,
  p_notes text default null
) returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_is_member boolean;
  v_seq bigint;
  v_year text := to_char(now(), 'YYYY');
  v_po text;
  v_row public.purchases;
begin
  -- Check if user is member of buyer org
  select exists (
    select 1 from public.org_members
    where org_id = p_buyer_org_id
      and user_id = v_user_id
      and status = 'active'
  ) into v_is_member;

  if not v_is_member then
    raise exception 'Not authorized to create purchase for this buyer org';
  end if;

  -- Generate PO number
  v_seq := nextval('public.po_number_seq');
  v_po := format('PO-%s-%06s', v_year, v_seq::text);

  -- Create purchase
  insert into public.purchases (
    purchase_id,
    buyer_org_id,
    supplier_org_id,
    deal_id,
    status,
    total_amount,
    currency,
    payload,
    notes,
    created_by
  ) values (
    v_po,
    p_buyer_org_id,
    p_supplier_org_id,
    p_deal_id,
    'pending',
    p_total_amount,
    p_currency,
    coalesce(p_payload, '{}'::jsonb),
    p_notes,
    public.jwt_user_id()
  )
  returning * into v_row;

  -- Notify supplier org
  perform pg_notify(
    'supplier_notifications',
    jsonb_build_object(
      'event', 'purchase_created',
      'supplier_org_id', p_supplier_org_id,
      'purchase_id', v_row.purchase_id,
      'purchase_po', v_row.purchase_id
    )::text
  );

  -- Create notification record
  insert into public.notifications (org_id, type, title, body, entity_type, entity_id)
  values (
    p_supplier_org_id,
    'system',
    'New Purchase Order',
    format('Purchase Order %s created', v_po),
    'purchase',
    v_row.id
  );

  return v_row;
end;
$$;

-- =========================================
-- 11) RPC: update_purchase_status
-- =========================================
create or replace function public.update_purchase_status(
  p_purchase_id text,
  p_status text
) returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_row public.purchases;
  v_authorized boolean;
begin
  -- Get purchase
  select * into v_row from public.purchases where purchase_id = p_purchase_id limit 1;
  if not found then
    raise exception 'Purchase not found';
  end if;

  -- Check authorization (member of either buyer or supplier org)
  select exists (
    select 1 from public.org_members
    where user_id = v_user_id
      and org_id in (v_row.buyer_org_id, v_row.supplier_org_id)
      and status = 'active'
  ) into v_authorized;

  if not v_authorized then
    raise exception 'Not authorized to update this purchase';
  end if;

  -- Validate status
  if p_status not in ('pending','accepted','rejected','paid','shipped','delivered','cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  -- Update
  update public.purchases
    set status = p_status,
        updated_at = now()
  where id = v_row.id
  returning * into v_row;

  -- Notify other party
  insert into public.notifications (org_id, type, title, body, entity_type, entity_id)
  values (
    case
      when v_row.buyer_org_id = (select org_id from org_members where user_id = v_user_id limit 1)
        then v_row.supplier_org_id
      else v_row.buyer_org_id
    end,
    'system',
    'Purchase Order Updated',
    format('Purchase Order %s status changed to %s', p_purchase_id, p_status),
    'purchase',
    v_row.id
  );

  return v_row;
end;
$$;

-- =========================================
-- 12) RPC: list_purchases
-- =========================================
create or replace function public.list_purchases()
returns setof public.purchases
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.purchases p
  where exists (
    select 1 from public.org_members m
    where m.user_id = public.current_sub()
      and m.org_id in (p.buyer_org_id, p.supplier_org_id)
      and m.status = 'active'
  )
  order by p.created_at desc
$$;

-- =========================================
-- 13) RPC: get_purchase
-- =========================================
create or replace function public.get_purchase(p_purchase_id text)
returns public.purchases
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.purchases p
  where p.purchase_id = p_purchase_id
    and exists (
      select 1 from public.org_members m
      where m.user_id = public.current_sub()
        and m.org_id in (p.buyer_org_id, p.supplier_org_id)
        and m.status = 'active'
    )
  limit 1
$$;

-- =========================================
-- 14) RPC: get_my_organizations
-- =========================================
create or replace function public.get_my_organizations()
returns setof public.organizations
language sql
stable
security definer
set search_path = public
as $$
  select o.*
  from public.organizations o
  inner join public.org_members m on m.org_id = o.id
  where m.user_id = public.current_sub()
    and m.status = 'active'
  order by o.name
$$;

-- =========================================
-- 15) RPC: get_org_members
-- =========================================
create or replace function public.get_org_members(p_org_id uuid)
returns setof public.org_members
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_is_member boolean;
begin
  -- Check if caller is member of org
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id
      and user_id = v_user_id
      and status = 'active'
  ) into v_is_member;

  if not v_is_member then
    raise exception 'Not authorized to view org members';
  end if;

  return query
  select * from public.org_members
  where org_id = p_org_id
  order by joined_at desc;
end;
$$;
