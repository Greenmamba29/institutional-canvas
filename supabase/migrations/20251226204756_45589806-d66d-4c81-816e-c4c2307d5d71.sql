-- Create reusable org membership validation helper function
-- This function checks if the current user is a member of the specified organization
-- Note: user_id is UUID, current_sub() returns TEXT, so we cast appropriately

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = (public.current_sub())::uuid  -- Cast TEXT to UUID
    AND org_id = p_org_id
  )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_org_member(uuid) IS 
'Validates that the current authenticated user is a member of the specified organization. 
Use this in RPC functions before performing any write operations: 
IF NOT is_org_member(p_org_id) THEN RAISE EXCEPTION ''Unauthorized''; END IF;';