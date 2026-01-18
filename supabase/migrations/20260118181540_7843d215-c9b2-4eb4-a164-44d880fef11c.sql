-- =============================================================================
-- SECURITY FIX: Error-level RLS Issues
-- Fixes: rfqs_column_migration_needed, profiles_table_public_exposure,
--        user_profiles_phone_exposure, organizations_contact_exposure
-- =============================================================================

-- =============================================================================
-- 1. FIX: RFQs Table RLS - Proper policies with correct column (organization_id)
-- =============================================================================

-- Drop broken/old policies
DROP POLICY IF EXISTS "authenticated_users_can_create_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "users_can_view_org_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "users_can_update_own_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "users_can_view_published_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_org" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_insert_org_member" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_org_member" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_update_own" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_delete_own_draft" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_submitted" ON public.rfqs;

-- Ensure RLS is enabled
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Create correct policies (org_members.user_id is uuid, not text)
CREATE POLICY "rfqs_insert_org_member"
ON public.rfqs
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT om.org_id FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "rfqs_select_org_member"
ON public.rfqs
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT om.org_id FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "rfqs_update_own"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "rfqs_delete_own_draft"
ON public.rfqs
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND status = 'draft'::rfq_status
);

-- Allow viewing published/submitted RFQs (for suppliers to bid)
CREATE POLICY "rfqs_select_submitted"
ON public.rfqs
FOR SELECT
TO authenticated
USING (
  status IN ('submitted'::rfq_status, 'closed'::rfq_status)
);

-- =============================================================================
-- 2. FIX: Profiles Table RLS - Ensure authenticated-only access
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_profile" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
ON public.profiles
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- =============================================================================
-- 3. FIX: User Profiles Table RLS - Ensure authenticated-only access
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_own" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access their own user_profile
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_own"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_delete_own"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================================================
-- 4. FIX: Organizations Table RLS - Ensure authenticated-only member access
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "organizations_select_member_only" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_users_can_insert_organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_no_direct_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_owner" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_member" ON public.organizations;
DROP POLICY IF EXISTS "Organizations are viewable by members" ON public.organizations;
DROP POLICY IF EXISTS "Organizations are updateable by owner" ON public.organizations;
DROP POLICY IF EXISTS "organizations_no_direct_delete" ON public.organizations;

-- Ensure RLS is enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Only authenticated org members can view their organization
CREATE POLICY "organizations_select_member_only"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT om.org_id FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Block direct inserts - force use of RPC function for validation/audit
CREATE POLICY "organizations_no_direct_insert"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Only owners can update organizations
CREATE POLICY "organizations_update_owner"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT om.org_id FROM public.org_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT om.org_id FROM public.org_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Block direct deletes - should go through RPC
CREATE POLICY "organizations_no_direct_delete"
ON public.organizations
FOR DELETE
TO authenticated
USING (false);