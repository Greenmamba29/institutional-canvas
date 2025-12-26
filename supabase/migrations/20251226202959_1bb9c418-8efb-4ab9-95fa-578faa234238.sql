-- Fix the supplier_directory view to use SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user, not the creator

DROP VIEW IF EXISTS public.supplier_directory;

CREATE VIEW public.supplier_directory 
WITH (security_invoker = true)
AS
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