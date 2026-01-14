-- =========================================
-- Team Management RPCs
-- Additional RPCs for managing organization members
-- =========================================

-- RPC: update_member_role
-- Updates a member's role in an organization
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_member_id uuid,
  p_new_role text
) RETURNS public.org_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := public.current_sub();
  v_member public.org_members;
  v_is_admin boolean;
  v_org_id uuid;
BEGIN
  -- Validate role
  IF p_new_role NOT IN ('owner', 'admin', 'member', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  -- Get member record
  SELECT * INTO v_member
  FROM public.org_members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  v_org_id := v_member.org_id;

  -- Check if caller is admin/owner of the org
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_org_id
      AND user_id = v_user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to update member roles';
  END IF;

  -- Prevent changing owner role (only owner can change owner)
  IF v_member.role = 'owner' AND v_user_id != v_member.user_id THEN
    RAISE EXCEPTION 'Only the owner can change their own role';
  END IF;

  -- Prevent removing the last owner
  IF v_member.role = 'owner' AND p_new_role != 'owner' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = v_org_id
        AND role = 'owner'
        AND id != p_member_id
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot remove the last owner. Promote another member to owner first.';
    END IF;
  END IF;

  -- Update role
  UPDATE public.org_members
  SET role = p_new_role,
      updated_at = now()
  WHERE id = p_member_id
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;

-- RPC: remove_organization_member
-- Removes a member from an organization (sets status to 'inactive')
CREATE OR REPLACE FUNCTION public.remove_organization_member(
  p_member_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := public.current_sub();
  v_member public.org_members;
  v_is_admin boolean;
  v_org_id uuid;
BEGIN
  -- Get member record
  SELECT * INTO v_member
  FROM public.org_members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  v_org_id := v_member.org_id;

  -- Check if caller is admin/owner of the org
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_org_id
      AND user_id = v_user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to remove members';
  END IF;

  -- Prevent removing owner
  IF v_member.role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove organization owner. Transfer ownership first.';
  END IF;

  -- Prevent removing yourself if you're the only admin
  IF v_member.user_id = v_user_id AND v_member.role = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = v_org_id
        AND role IN ('owner', 'admin')
        AND id != p_member_id
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot remove the last admin. Promote another member first.';
    END IF;
  END IF;

  -- Set status to inactive (soft delete)
  UPDATE public.org_members
  SET status = 'inactive',
      updated_at = now()
  WHERE id = p_member_id;

  RETURN true;
END;
$$;

-- RPC: get_org_members
-- Gets all active members of an organization
CREATE OR REPLACE FUNCTION public.get_org_members(
  p_org_id uuid
) RETURNS SETOF public.org_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := public.current_sub();
  v_is_member boolean;
BEGIN
  -- Check if user is a member of the org
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = v_user_id
      AND status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  -- Return all active members
  RETURN QUERY
  SELECT *
  FROM public.org_members
  WHERE org_id = p_org_id
    AND status = 'active'
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'member' THEN 3
      WHEN 'viewer' THEN 4
    END,
    joined_at ASC;
END;
$$;

COMMENT ON FUNCTION public.update_member_role IS 'Updates a member role. Only org admins/owners can update roles.';
COMMENT ON FUNCTION public.remove_organization_member IS 'Removes a member from organization (soft delete). Only org admins/owners can remove members.';
COMMENT ON FUNCTION public.get_org_members IS 'Gets all active members of an organization. User must be a member to view.';
