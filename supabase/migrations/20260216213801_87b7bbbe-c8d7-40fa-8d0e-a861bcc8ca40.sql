
-- =============================================================
-- FIX 1: Organization membership bypass
-- =============================================================

CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  email text,
  role text NOT NULL DEFAULT 'member',
  invited_by text NOT NULL,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  claimed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_token_unclaimed 
  ON public.org_invites(token) WHERE claimed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id 
  ON public.org_invites(org_id);

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_invites_select_org_admins"
ON public.org_invites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_invites.org_id
      AND om.user_id = public.current_sub()::uuid
      AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "org_invites_insert_org_admins"
ON public.org_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_invites.org_id
      AND om.user_id = public.current_sub()::uuid
      AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "org_invites_delete_org_admins"
ON public.org_invites FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_invites.org_id
      AND om.user_id = public.current_sub()::uuid
      AND om.role IN ('owner', 'admin')
  )
);

-- Redefine claim_org_membership to REQUIRE valid invite token
CREATE OR REPLACE FUNCTION public.claim_org_membership(
  p_org_id uuid,
  p_invite_token text DEFAULT NULL
) RETURNS public.org_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := public.current_sub();
  v_invite record;
  v_row public.org_members;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_invite_token IS NULL OR p_invite_token = '' THEN
    RAISE EXCEPTION 'Invite token is required to join an organization';
  END IF;

  SELECT * INTO v_invite FROM public.org_invites
  WHERE token = p_invite_token
    AND org_id = p_org_id
    AND claimed_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id AND user_id = v_user_id::uuid
  ) THEN
    RAISE EXCEPTION 'Already a member of this organization';
  END IF;

  INSERT INTO public.org_members (org_id, user_id, role, status)
  VALUES (p_org_id, v_user_id::uuid, v_invite.role, 'active')
  RETURNING * INTO v_row;

  UPDATE public.org_invites
  SET claimed_at = now(), claimed_by = v_user_id
  WHERE id = v_invite.id;

  RETURN v_row;
END;
$$;

-- =============================================================
-- FIX 3: Permissive RLS on ai_analysis_results
-- =============================================================

DROP POLICY IF EXISTS "Users can view their own analysis results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Users can create their own analysis results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "ai_analysis_results_select" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ai_analysis_results;

CREATE POLICY "ai_analysis_results_select_owner"
ON public.ai_analysis_results FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "ai_analysis_results_insert_owner"
ON public.ai_analysis_results FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_analysis_results_update_owner"
ON public.ai_analysis_results FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "ai_analysis_results_delete_owner"
ON public.ai_analysis_results FOR DELETE TO authenticated
USING (user_id = auth.uid());
