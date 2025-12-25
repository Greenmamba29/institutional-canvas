-- =========================================
-- Security Fixes Verification Queries
-- Run these AFTER applying 20251224_security_fixes.sql
-- =========================================

-- =========================================
-- 1) Verify ALL Tables Have RLS Enabled
-- =========================================
-- Expected: 0 rows (all tables should have RLS)
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;

-- If any tables show up, they're missing RLS (CRITICAL ISSUE)

-- =========================================
-- 2) List All Tables WITH RLS (Should See Your Tables)
-- =========================================
-- Expected: See organizations, org_members, purchases, rfqs, deals, 
--           bids, auctions, auction_bids, notifications, price_indicators,
--           products, suppliers, audit_log
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = true
ORDER BY tablename;

-- =========================================
-- 3) Verify Security Definer Functions Have Search Path Set
-- =========================================
-- Expected: 0 rows (all security definer functions should have search_path)
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE prosecdef = true 
  AND proname NOT LIKE 'pg_%'
  AND prosrc NOT LIKE '%set search_path%'
ORDER BY proname;

-- If any functions show up, they're vulnerable to search_path attacks

-- =========================================
-- 4) List All Security Definer Functions (For Reference)
-- =========================================
-- Expected: See your RPC functions (create_purchase, log_audit_event, etc.)
SELECT 
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%set search_path = public%' THEN '✅ Secure'
    ELSE '❌ VULNERABLE'
  END as search_path_status
FROM pg_proc
WHERE prosecdef = true 
  AND proname NOT LIKE 'pg_%'
ORDER BY proname;

-- =========================================
-- 5) Verify Audit Log Table Exists
-- =========================================
-- Expected: 1 row with table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'audit_log'
ORDER BY ordinal_position;

-- Should see: id, org_id, user_id, action, entity_type, entity_id, outcome, metadata, created_at

-- =========================================
-- 6) Test Audit Logging Function
-- =========================================
-- Expected: No errors (will fail if not authenticated, but function exists)
-- SKIP THIS IF NOT LOGGED IN - Just check function exists:
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'log_audit_event'
) as audit_function_exists;

-- Should return: true

-- =========================================
-- 7) Check RLS Policies Exist
-- =========================================
-- Expected: Multiple rows showing policies on your tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Should see policies for: organizations, org_members, purchases, audit_log, etc.

-- =========================================
-- 8) Verify Products Table Has RLS Policy
-- =========================================
-- Expected: 1 row (products_select_all)
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'products';

-- Should see: products_select_all with auth.uid() check

-- =========================================
-- 9) Verify Suppliers Table Has RLS Policy
-- =========================================
-- Expected: 1 row (suppliers_select_own_org)
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'suppliers';

-- Should see: suppliers_select_own_org with jwt_org_id() check

-- =========================================
-- 10) Check Postgres Version
-- =========================================
-- Expected: PostgreSQL 15.x or higher
SELECT version();

-- Look for security patches mentioned in version string

-- =========================================
-- 11) Count Security Definer Functions
-- =========================================
-- Expected: 15+ functions (your RPC functions)
SELECT 
  COUNT(*) as security_definer_count
FROM pg_proc
WHERE prosecdef = true 
  AND proname NOT LIKE 'pg_%';

-- Should be: 15-20 functions

-- =========================================
-- 12) Verify Direct Mutations Are Revoked
-- =========================================
-- Expected: No INSERT/UPDATE/DELETE grants for anon/authenticated on critical tables
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'purchases', 'audit_log', 'products', 'suppliers')
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
ORDER BY table_name, grantee, privilege_type;

-- Expected: 0 rows (all direct mutations should be revoked)
-- If you see rows, direct mutations are still allowed (SECURITY RISK)

-- =========================================
-- SUMMARY CHECKS
-- =========================================

-- Quick Summary Query
SELECT 
  'Tables with RLS' as check_name,
  COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
  'Tables without RLS' as check_name,
  COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false

UNION ALL

SELECT 
  'Security Definer Functions' as check_name,
  COUNT(*) as count
FROM pg_proc
WHERE prosecdef = true AND proname NOT LIKE 'pg_%'

UNION ALL

SELECT 
  'RLS Policies' as check_name,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public';

-- Expected Results:
-- Tables with RLS: 13-15 (all your tables)
-- Tables without RLS: 0 (CRITICAL if > 0)
-- Security Definer Functions: 15-20 (your RPC functions)
-- RLS Policies: 15-20 (policies for each table)

-- =========================================
-- INTERPRETATION GUIDE
-- =========================================

/*
✅ PASS CRITERIA:
- "Tables without RLS" = 0
- "Security Definer Functions" > 10
- "RLS Policies" > 10
- No functions missing search_path
- No direct INSERT/UPDATE/DELETE grants on critical tables
- audit_log table exists with 9 columns
- products_select_all policy exists
- suppliers_select_own_org policy exists

❌ FAIL CRITERIA:
- Any table without RLS
- Any security definer function without search_path
- Any direct mutation grants still active
- audit_log table missing
- Policies missing on products/suppliers

🟡 WARNING:
- Postgres version < 15.0
- Fewer than expected RLS policies
- Unexpected grants to public role
*/
