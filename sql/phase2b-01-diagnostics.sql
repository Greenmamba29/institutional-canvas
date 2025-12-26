-- ============================================================================
-- PHASE 2B: COMPREHENSIVE DATABASE DIAGNOSTIC
-- ============================================================================
-- Run this in Supabase SQL Editor to identify all issues
-- ============================================================================

-- PART 1: Check all critical tables and their complete schemas
-- ============================================================================
SELECT 
  '=== TABLE SCHEMAS ===' as section,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'org_members', 'rfqs', 'users')
ORDER BY table_name, ordinal_position;

-- PART 2: Check all RPC functions related to organizations and RFQs
-- ============================================================================
SELECT 
  '=== FUNCTIONS ===' as section,
  routine_name as name,
  routine_type as type,
  data_type as return_type,
  external_language as language
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%organization%' OR routine_name LIKE '%rfq%')
ORDER BY routine_name;

-- PART 3: Check helper functions exist
-- ============================================================================
SELECT 
  '=== HELPER FUNCTIONS ===' as section,
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('jwt_user_id', 'current_sub', 'auth_uid')
  AND pronamespace = 'public'::regnamespace;

-- PART 4: Check auth.uid() function availability
-- ============================================================================
SELECT 
  '=== AUTH FUNCTIONS ===' as section,
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'uid'
  AND pronamespace = 'auth'::regnamespace;

-- PART 5: Check RLS policies on critical tables
-- ============================================================================
SELECT 
  '=== RLS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text as roles,
  cmd as command,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'org_members', 'rfqs')
ORDER BY tablename, policyname;

-- PART 6: Check table-level RLS status
-- ============================================================================
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'org_members', 'rfqs')
ORDER BY tablename;

-- PART 7: Check QA accounts and their organizations
-- ============================================================================
SELECT 
  '=== QA ACCOUNTS STATUS ===' as section,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.id as user_id,
  COUNT(om.org_id) as org_count,
  MAX(o.name) as org_name,
  MAX(o.org_type) as org_type,
  MAX(om.role) as role
FROM auth.users u
LEFT JOIN public.org_members om ON om.user_id = u.id::text AND om.status = 'active'
LEFT JOIN public.organizations o ON o.id = om.org_id
WHERE u.email LIKE '%qa-test%'
GROUP BY u.email, u.email_confirmed_at, u.id
ORDER BY u.email;

-- PART 8: Check existing data counts
-- ============================================================================
SELECT '=== DATA COUNTS ===' as section;
SELECT 'organizations' as table_name, COUNT(*) as count FROM public.organizations
UNION ALL
SELECT 'org_members' as table_name, COUNT(*) as count FROM public.org_members
UNION ALL
SELECT 'rfqs' as table_name, COUNT(*) as count FROM public.rfqs;
