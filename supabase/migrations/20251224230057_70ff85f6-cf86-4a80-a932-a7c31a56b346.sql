-- Fix 1: Harden respond_to_offer authorization
CREATE OR REPLACE FUNCTION public.respond_to_offer(
  p_deal_id uuid,
  p_decision public.offer_decision,
  p_note text
) RETURNS public.deals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_sub text := public.current_sub();
  v_supplier_org uuid;
  v_is_authorized boolean;
  v_row public.deals;
BEGIN
  IF v_user_sub IS NULL OR v_user_sub = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get supplier org for this deal
  SELECT d.supplier_id
  INTO v_supplier_org
  FROM public.deals d
  WHERE d.id = p_deal_id;

  IF NOT FOUND OR v_supplier_org IS NULL THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  -- Verify caller is an active member of the supplier org
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members m
    WHERE m.org_id = v_supplier_org
      AND m.user_id = v_user_sub
      AND m.status = 'active'
  )
  INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to respond to this deal';
  END IF;

  -- Update deal decision
  UPDATE public.deals
  SET offer_decision = p_decision,
      offer_decision_at = now(),
      offer_note = p_note,
      status = CASE WHEN p_decision = 'accepted' THEN 'active' ELSE 'rejected' END
  WHERE id = p_deal_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  -- Notify buyer org
  INSERT INTO public.notifications(org_id, type, title, body, entity_type, entity_id)
  VALUES (
    v_row.org_id,
    'deal_offer_response',
    'Supplier responded to offer',
    CASE WHEN p_decision = 'accepted' THEN 'Accepted your offer.' ELSE 'Rejected your offer.' END,
    'deal',
    v_row.id
  );

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_offer(uuid, public.offer_decision, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_offer(uuid, public.offer_decision, text) TO authenticated;


-- Fix 2: Enable RLS on suppliers and expose only safe public data via a view
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Ensure no direct mutations (RPC-only)
REVOKE INSERT, UPDATE, DELETE ON TABLE public.suppliers FROM anon, authenticated;

-- Allow supplier org members to read their own supplier record (full row)
DROP POLICY IF EXISTS suppliers_select_own_org ON public.suppliers;
CREATE POLICY suppliers_select_own_org
ON public.suppliers
FOR SELECT
USING (
  org_id IN (
    SELECT m.org_id
    FROM public.org_members m
    WHERE m.user_id = public.current_sub()
      AND m.status = 'active'
  )
);

-- Make sure no broad SELECT policy exists
DROP POLICY IF EXISTS suppliers_select_authenticated ON public.suppliers;
DROP POLICY IF EXISTS suppliers_select_public ON public.suppliers;
DROP POLICY IF EXISTS suppliers_view_public ON public.suppliers;
DROP POLICY IF EXISTS suppliers_view_own ON public.suppliers;

-- Create a public-safe view for the marketplace directory
CREATE OR REPLACE VIEW public.suppliers_public
WITH (security_barrier = true)
AS
SELECT
  s.org_id,
  s.display_name,
  s.public_profile,
  s.verification_tier,
  s.capabilities
FROM public.suppliers s;

-- Allow marketplace reads without exposing private supplier fields
GRANT SELECT ON public.suppliers_public TO anon, authenticated;

-- Optional: prevent writes to the view explicitly
REVOKE INSERT, UPDATE, DELETE ON public.suppliers_public FROM anon, authenticated;
