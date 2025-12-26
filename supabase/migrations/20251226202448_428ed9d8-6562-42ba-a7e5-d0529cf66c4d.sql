-- =============================================
-- Fix Error-Level Security Issues
-- 1. Organizations: Restrict SELECT to org members only
-- 2. RFQs: Fix RLS policies to use organization_id properly
-- =============================================

-- =============================================
-- 1. FIX ORGANIZATIONS TABLE RLS
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS organizations_select_all ON public.organizations;

-- Create restricted policy: users can only see orgs they belong to
CREATE POLICY organizations_select_member_only ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id::text = public.current_sub()
    )
  );

-- =============================================
-- 2. FIX RFQS TABLE RLS POLICIES
-- =============================================

-- Drop existing policies that don't properly enforce org isolation
DROP POLICY IF EXISTS rfqs_select_org ON public.rfqs;
DROP POLICY IF EXISTS users_can_view_submitted_rfqs ON public.rfqs;
DROP POLICY IF EXISTS users_can_update_own_rfqs ON public.rfqs;
DROP POLICY IF EXISTS authenticated_users_can_create_rfqs ON public.rfqs;
DROP POLICY IF EXISTS users_can_view_org_rfqs ON public.rfqs;
DROP POLICY IF EXISTS users_can_view_published_rfqs ON public.rfqs;

-- Create proper org-based RLS policies for RFQs

-- Users can view RFQs belonging to their organization
CREATE POLICY rfqs_select_org_member ON public.rfqs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = rfqs.organization_id
        AND org_members.user_id::text = public.current_sub()
    )
  );

-- Suppliers can view submitted RFQs from any org (marketplace feature)
-- Using valid enum values: draft, submitted, closed, cancelled
CREATE POLICY rfqs_select_submitted ON public.rfqs
  FOR SELECT USING (
    status = 'submitted'
    AND public.current_sub() IS NOT NULL
  );

-- Users can create RFQs only for orgs they belong to
CREATE POLICY rfqs_insert_org_member ON public.rfqs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = rfqs.organization_id
        AND org_members.user_id::text = public.current_sub()
    )
    AND created_by::text = public.current_sub()
  );

-- Users can update RFQs they created in their org
CREATE POLICY rfqs_update_own ON public.rfqs
  FOR UPDATE USING (
    created_by::text = public.current_sub()
    AND EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = rfqs.organization_id
        AND org_members.user_id::text = public.current_sub()
    )
  );

-- Users can delete RFQs they created (only draft status)
CREATE POLICY rfqs_delete_own_draft ON public.rfqs
  FOR DELETE USING (
    created_by::text = public.current_sub()
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = rfqs.organization_id
        AND org_members.user_id::text = public.current_sub()
    )
  );

-- =============================================
-- 3. CREATE PUBLIC SUPPLIER DIRECTORY VIEW
-- (For marketplace - exposes only non-sensitive org info)
-- =============================================

DROP VIEW IF EXISTS public.supplier_directory;
CREATE VIEW public.supplier_directory AS
SELECT
  o.id,
  o.name,
  o.org_type,
  o.created_at
FROM public.organizations o
WHERE o.org_type = 'supplier'
  AND o.status = 'active';

-- Grant access to authenticated users
GRANT SELECT ON public.supplier_directory TO authenticated;