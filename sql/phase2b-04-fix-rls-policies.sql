-- ============================================================================
-- PHASE 2B: FIX RLS POLICIES FOR ORGANIZATIONS AND ORG_MEMBERS
-- ============================================================================
-- Ensure proper access control while allowing necessary operations
-- ============================================================================

-- ============================================================================
-- ORGANIZATIONS TABLE RLS
-- ============================================================================

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Enable update for organization members" ON public.organizations;

-- Policy 1: Allow authenticated users to INSERT organizations
-- The create_organization function handles validation
CREATE POLICY "authenticated_users_can_insert_organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow users to SELECT organizations they're members of
CREATE POLICY "users_can_view_their_organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
  )
);

-- Policy 3: Allow organization admins/owners to UPDATE their organization
CREATE POLICY "org_admins_can_update_organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
    AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- ORG_MEMBERS TABLE RLS
-- ============================================================================

-- Enable RLS on org_members table
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can create org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.org_members;
DROP POLICY IF EXISTS "Users can view org members" ON public.org_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.org_members;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.org_members;

-- Policy 1: Allow authenticated users to INSERT org_members
-- The create_organization function handles this, but also allow direct inserts for invitations
CREATE POLICY "authenticated_users_can_insert_memberships"
ON public.org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Either the user is adding themselves
  user_id = auth.uid()::text
  OR
  -- Or they're an admin/owner of the organization
  EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = org_members.org_id
    AND user_id = auth.uid()::text
    AND status = 'active'
    AND role IN ('owner', 'admin')
  )
);

-- Policy 2: Allow users to SELECT their own memberships
CREATE POLICY "users_can_view_their_memberships"
ON public.org_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Policy 3: Allow users to SELECT other members in their organization
CREATE POLICY "users_can_view_org_members"
ON public.org_members
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
  )
);

-- Policy 4: Allow admins/owners to UPDATE memberships in their organization
CREATE POLICY "org_admins_can_update_memberships"
ON public.org_members
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()::text
    AND status = 'active'
    AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all policies
SELECT 
  '=== RLS POLICIES CREATED ===' as section,
  schemaname,
  tablename,
  policyname,
  cmd as command,
  roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'org_members')
ORDER BY tablename, policyname;

-- Show RLS status
SELECT 
  '=== RLS ENABLED ===' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'org_members')
ORDER BY tablename;
