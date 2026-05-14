-- =====================================================
-- LithiumBuy Supabase DB Update — May 2026
-- Applied via Supabase MCP (apply_migration + execute_sql).
-- Run verification queries below before closing ticket.
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. webhook_events table (CRITICAL — fixes silent 500s)
--    Status: APPLIED via MCP on 2026-05-12
-- ─────────────────────────────────────────────────────
-- Creates the table that all edge functions log to.
-- Also adds status column with constraint.
--
-- Verify:
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'webhook_events'
order by ordinal_position;
-- Expected: id, event_type, source, table_name, payload, status, error_msg, created_at


-- ─────────────────────────────────────────────────────
-- 2. introductions table
--    Status: APPLIED via MCP on 2026-05-12
-- ─────────────────────────────────────────────────────
-- Includes buyer_org_id + seller_org_id FK columns so
-- RLS can expose introductions to all three parties.
--
-- Verify columns:
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'introductions'
  and column_name in ('buyer_org_id','seller_org_id','org_id','status','airtable_id')
order by column_name;
-- Expected: all 5 rows returned

-- Verify RLS policy covers buyer/seller visibility:
select policyname, cmd, qual
from pg_policies
where tablename = 'introductions';
-- Expected: policy qual should reference buyer_org_id OR seller_org_id alongside org_id


-- ─────────────────────────────────────────────────────
-- 3. collection_sites table — column additions
--    Status: APPLIED via ALTER TABLE on 2026-05-12
-- ─────────────────────────────────────────────────────
-- Original table had name/address/partner_type/capacity_kg.
-- Edge function transformer writes to site_name/location/site_type/capacity_mt etc.
-- ALTER TABLE added the missing columns.
--
-- Verify:
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'collection_sites'
  and column_name in ('site_id','site_name','location','country','region','site_type',
                      'capacity_mt','manager_name','contact_email','contact_phone',
                      'compliance_status','last_inspection','next_inspection','supabase_id')
order by column_name;
-- Expected: all 14 rows returned


-- ─────────────────────────────────────────────────────
-- 4. strategic_partners table
--    Status: APPLIED + SEEDED (25 rows) on 2026-05-12
-- ─────────────────────────────────────────────────────
-- Super-admin-only CRM table for matchmaking pipeline.
--
-- Verify row count:
select count(*) as total_partners,
       count(*) filter (where partner_tier = 'Tier 1') as tier1,
       count(*) filter (where partner_tier = 'Tier 2') as tier2,
       count(*) filter (where partner_tier = 'Tier 3') as tier3
from public.strategic_partners;
-- Expected: total=25, tier1=13, tier2=7, tier3=5

-- Verify RLS (only super_admins can read):
select policyname, cmd
from pg_policies
where tablename = 'strategic_partners';


-- ─────────────────────────────────────────────────────
-- 5. organizations table — contact columns check
--    Status: VERIFY only (no migration applied here)
-- ─────────────────────────────────────────────────────
-- The Buyer_Organizations edge function transformer maps to:
--   Organization_Name → name
--   Contact Email     → email
--   Status            → status
-- Confirm these columns exist:
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'organizations'
  and column_name in ('name','email','status','airtable_id','org_type')
order by column_name;
-- If email is missing, run:
-- alter table public.organizations add column if not exists email text;


-- ─────────────────────────────────────────────────────
-- 6. End-to-end smoke test
-- ─────────────────────────────────────────────────────
-- After Airtable automation scripts are deployed, trigger
-- "Supplier Updated" on Global Lithium Supplies Co. record,
-- then run:
select event_type, status, error_msg, created_at
from public.webhook_events
order by created_at desc
limit 5;
-- Expected: most recent row has status = 'success', error_msg IS NULL

-- Also verify introduction visibility:
-- Create a test introduction with buyer_org_id set to an existing org UUID,
-- then log in as a user from that org and confirm useMyMatches() returns it.


-- ─────────────────────────────────────────────────────
-- ROLLBACK NOTES
-- ─────────────────────────────────────────────────────
-- webhook_events:  drop table public.webhook_events cascade;
-- introductions:   drop table public.introductions cascade;
-- strategic_partners: drop table public.strategic_partners cascade;
-- collection_sites columns: these are additive — safe to leave;
--   if removal needed: alter table public.collection_sites drop column if exists <col>;
-- =====================================================
