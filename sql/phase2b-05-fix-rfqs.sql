-- ============================================================================
-- PHASE 2B: RFQ TABLE DIAGNOSTIC AND FIX
-- ============================================================================
-- Check schema and fix RLS policies for RFQs
-- ============================================================================

-- PART 1: Diagnostic - Check RFQ table schema
-- ============================================================================
SELECT 
  '=== RFQ TABLE SCHEMA ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rfqs'
ORDER BY ordinal_position;

-- PART 2: Check existing RLS policies
-- ============================================================================
SELECT 
  '=== EXISTING RFQ POLICIES ===' as section,
  policyname,
  permissive,
  roles::text,
  cmd as command,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'rfqs'
  AND schemaname = 'public';

-- PART 3: Check if RLS is enabled
-- ============================================================================
SELECT 
  '=== RLS STATUS ===' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'rfqs'
  AND schemaname = 'public';

-- ============================================================================
-- FIX: Enable RLS and create proper policies
-- ============================================================================

-- Enable RLS on rfqs table
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can create rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can view rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can update their rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rfqs;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.rfqs;
DROP POLICY IF EXISTS "Enable update for rfq owners" ON public.rfqs;

-- Policy 1: Allow authenticated users to INSERT RFQs
-- Must belong to an organization
CREATE POLICY "authenticated_users_can_create_rfqs"
ON public.rfqs
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be a member of the organization they're creating RFQ for
  organization_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
  )
  AND
  -- User must be the creator
  created_by = auth.uid()::text
);

-- Policy 2: Allow users to SELECT RFQs from their organization
CREATE POLICY "users_can_view_org_rfqs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
  )
);

-- Policy 3: Allow users to UPDATE their own RFQs
CREATE POLICY "users_can_update_own_rfqs"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (created_by = auth.uid()::text)
WITH CHECK (created_by = auth.uid()::text);

-- Policy 4: Allow users to view public/published RFQs (marketplace)
-- This allows buyers to see supplier RFQs and vice versa
CREATE POLICY "users_can_view_published_rfqs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (
  status IN ('published', 'active')
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all policies
SELECT 
  '=== RFQ POLICIES CREATED ===' as section,
  policyname,
  cmd as command,
  roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rfqs'
ORDER BY policyname;

-- Check RLS enabled
SELECT 
  '=== RLS ENABLED ===' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'rfqs';

-- Count existing RFQs
SELECT 
  '=== RFQ COUNT ===' as section,
  COUNT(*) as total_rfqs
FROM public.rfqs;
