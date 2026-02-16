
-- Fix overly permissive RLS policies

-- 1. compliance_checks: restrict writes to super admins only
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.compliance_checks;

CREATE POLICY "compliance_checks_select_authenticated"
ON public.compliance_checks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "compliance_checks_insert_admin"
ON public.compliance_checks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

CREATE POLICY "compliance_checks_update_admin"
ON public.compliance_checks FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

CREATE POLICY "compliance_checks_delete_admin"
ON public.compliance_checks FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

-- 2. soe_organizations: restrict writes to super admins (reference data table)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.soe_organizations;

CREATE POLICY "soe_organizations_select_authenticated"
ON public.soe_organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "soe_organizations_insert_admin"
ON public.soe_organizations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

CREATE POLICY "soe_organizations_update_admin"
ON public.soe_organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

CREATE POLICY "soe_organizations_delete_admin"
ON public.soe_organizations FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

-- 3. telebuy_documents: add SELECT policy (currently only INSERT exists)
CREATE POLICY "telebuy_documents_select_authenticated"
ON public.telebuy_documents FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
