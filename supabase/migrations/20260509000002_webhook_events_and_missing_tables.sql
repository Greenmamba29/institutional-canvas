-- =====================================================
-- LithiumBuy Supabase DB Update — May 2026
-- Fixes:
--   1. webhook_events missing status column (caused silent 500s in all edge functions)
--   2. collection_sites table missing (webhook sync was failing silently)
-- =====================================================

-- 1. Add status column to webhook_events
--    All edge functions insert status='success'|'partial'|'error' but the column
--    didn't exist — PostgREST returned an error on every insert, making all
--    webhook logging fail and causing downstream 500s.
alter table public.webhook_events
  add column if not exists status text default 'success'
    check (status in ('success', 'partial', 'error', 'pending'));

-- 2. Create collection_sites table
--    Mirrors Airtable Collection_Sites (tbl228fEQlU1ZHsIx).
--    The airtable-market-webhook edge function references this table in its
--    transformer map but it didn't exist in Supabase, causing all sync attempts
--    for collection site updates to fail.
create table if not exists public.collection_sites (
  id                uuid primary key default gen_random_uuid(),
  airtable_id       text unique,
  site_id           text,
  site_name         text,
  location          text,
  country           text,
  region            text,
  site_type         text,
  capacity_mt       numeric,
  status            text,
  manager_name      text,
  contact_email     text,
  contact_phone     text,
  certifications    text[],
  last_inspection   date,
  next_inspection   date,
  compliance_status text,
  notes             text,
  supabase_id       text,
  org_id            uuid references public.organizations(id) on delete cascade,
  synced_at         timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Trigger to keep updated_at current
create or replace function public.set_collection_sites_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger collection_sites_updated_at
  before update on public.collection_sites
  for each row execute function public.set_collection_sites_updated_at();

-- RLS
alter table public.collection_sites enable row level security;

create policy "org members can read collection_sites"
  on public.collection_sites for select
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "org members can insert collection_sites"
  on public.collection_sites for insert
  with check (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "org members can update collection_sites"
  on public.collection_sites for update
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

-- Service role gets unrestricted access for webhook sync
create policy "service role full access collection_sites"
  on public.collection_sites
  as permissive for all
  to service_role
  using (true)
  with check (true);

-- Indexes
create index collection_sites_org_id_idx     on public.collection_sites(org_id);
create index collection_sites_airtable_id_idx on public.collection_sites(airtable_id);
create index collection_sites_status_idx      on public.collection_sites(status);

-- =====================================================
-- Verification queries (run after applying):
--
-- select column_name from information_schema.columns
--   where table_name = 'webhook_events' and column_name = 'status';
-- --> should return 1 row
--
-- select count(*) from public.collection_sites;
-- --> should return 0 (empty, no error)
-- =====================================================
