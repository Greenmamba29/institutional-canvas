-- Fix get_my_organizations() function - remove invalid m.status filter
-- The org_members table does not have a 'status' column

CREATE OR REPLACE FUNCTION public.get_my_organizations()
RETURNS SETOF public.organizations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.*
  FROM public.organizations o
  INNER JOIN public.org_members m ON m.org_id = o.id
  WHERE m.user_id::text = public.current_sub()
  ORDER BY o.name
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_organizations() TO authenticated;