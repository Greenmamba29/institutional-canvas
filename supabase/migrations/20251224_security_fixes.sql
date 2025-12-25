-- =========================================
-- Security Fixes for Lovable Security Scan
-- Date: 2024-12-24
-- =========================================

-- =========================================
-- 1) Verify RLS on all existing tables
-- =========================================

-- Ensure products table has RLS (if it exists)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'products'
  ) then
    alter table public.products enable row level security;
    
    -- Add select policy for authenticated users
    drop policy if exists products_select_all on public.products;
    create policy products_select_all on public.products
      for select using (auth.uid() is not null);
    
    -- Lock down direct mutations
    revoke insert, update, delete on public.products from anon, authenticated;
  end if;
end
$$;

-- Ensure suppliers table has RLS (if it exists)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'suppliers'
  ) then
    alter table public.suppliers enable row level security;
    
    -- Suppliers can view their own org data
    drop policy if exists suppliers_select_own_org on public.suppliers;
    create policy suppliers_select_own_org on public.suppliers
      for select using (
        org_id = public.jwt_org_id() or
        -- Allow buyers to see supplier listings
        public.jwt_user_id() is not null
      );
    
    -- Lock down direct mutations
    revoke insert, update, delete on public.suppliers from anon, authenticated;
  end if;
end
$$;

-- =========================================
-- 2) Fix Auth Configuration Issues
-- =========================================

-- Note: These settings must be configured in Supabase Dashboard > Authentication
-- This is documentation for manual configuration:
--
-- AUTH OTP LONG EXPIRY:
--   - Navigate to: Authentication > Settings > Email Templates
--   - Set OTP expiry to 5 minutes (300 seconds) instead of default 24 hours
--   - This prevents security risk of long-lived OTPs
--
-- LEAKED PASSWORD PROTECTION:
--   - Navigate to: Authentication > Policies
--   - Enable "Breach Password Protection"
--   - This checks passwords against known breach databases
--
-- POSTGRES VERSION UPDATE:
--   - Check current version: SELECT version();
--   - Update via Supabase Dashboard if patches are available
--   - Navigate to: Database > Settings > Check for updates

-- =========================================
-- 3) Audit Trail Enhancement
-- =========================================

-- Create audit_log table if it doesn't exist (per RULE 3: Emergency System Safety)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid null,
  user_id text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  outcome text not null check (outcome in ('success', 'failure', 'error')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_org_id_idx on public.audit_log(org_id);
create index if not exists audit_log_user_id_idx on public.audit_log(user_id);
create index if not exists audit_log_action_idx on public.audit_log(action);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at);

-- Enable RLS on audit log
alter table public.audit_log enable row level security;

-- Policy: users can only read their own org's audit logs
create policy if not exists audit_log_select_own_org on public.audit_log
  for select using (
    exists (
      select 1 from public.org_members m
      where m.user_id = public.current_sub()
        and m.org_id = audit_log.org_id
        and m.role in ('owner', 'admin')
        and m.status = 'active'
    )
  );

-- Lock down direct mutations (use RPC only)
revoke insert, update, delete on public.audit_log from anon, authenticated;

-- =========================================
-- 4) Security Definer Functions - Set Search Path
-- =========================================

-- All existing security definer functions already have 'set search_path = public'
-- This prevents search_path manipulation attacks
-- Verify with: SELECT proname FROM pg_proc WHERE prosecdef = true;

-- =========================================
-- 5) Function to log security events
-- =========================================

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_outcome text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_org_id uuid;
  v_log_id uuid;
begin
  -- Get user's primary org
  select org_id into v_org_id
  from public.org_members
  where user_id = v_user_id
    and status = 'active'
  limit 1;

  insert into public.audit_log (org_id, user_id, action, entity_type, entity_id, outcome, metadata)
  values (v_org_id, v_user_id, p_action, p_entity_type, p_entity_id, p_outcome, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_log_id;

  return v_log_id;
end;
$$;

-- =========================================
-- 6) RPC: Get Audit Logs (Admin Only)
-- =========================================

create or replace function public.get_audit_logs(
  p_limit int default 100,
  p_offset int default 0
) returns setof public.audit_log
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_sub();
  v_is_admin boolean;
begin
  -- Check if user is admin of any org
  select exists (
    select 1 from public.org_members
    where user_id = v_user_id
      and role in ('owner', 'admin')
      and status = 'active'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not authorized to view audit logs';
  end if;

  return query
  select a.*
  from public.audit_log a
  inner join public.org_members m on m.org_id = a.org_id
  where m.user_id = v_user_id
    and m.role in ('owner', 'admin')
    and m.status = 'active'
  order by a.created_at desc
  limit coalesce(p_limit, 100)
  offset coalesce(p_offset, 0);
end;
$$;

-- =========================================
-- 7) Add audit logging to critical functions
-- =========================================

-- Update create_purchase to log audit events
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
    -- Log failed attempt
    perform public.log_audit_event(
      'create_purchase',
      'purchase',
      null,
      'failure',
      jsonb_build_object('reason', 'not_authorized', 'buyer_org_id', p_buyer_org_id)
    );
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

  -- Log successful creation
  perform public.log_audit_event(
    'create_purchase',
    'purchase',
    v_row.id,
    'success',
    jsonb_build_object('purchase_id', v_row.purchase_id, 'total_amount', p_total_amount)
  );

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
-- 8) Security Headers Documentation
-- =========================================

-- IMPORTANT: Configure these in Supabase Dashboard > Storage > Policies
--
-- Content Security Policy:
--   Add header: Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
--
-- CORS Configuration:
--   Allowed origins: https://yourdomain.com (replace with actual domain)
--   Allowed methods: GET, POST, PUT, DELETE, OPTIONS
--   Allowed headers: Authorization, Content-Type
--
-- Rate Limiting:
--   Enable rate limiting in Supabase Dashboard
--   Set appropriate limits for API endpoints (e.g., 100 requests/minute)

-- =========================================
-- 9) Verification Queries
-- =========================================

-- Check all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = false;

-- Check all security definer functions have search_path set:
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE prosecdef = true
--   AND proname NOT LIKE 'pg_%'
--   AND prosrc NOT LIKE '%set search_path%';

-- Test audit logging:
-- SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 10;
