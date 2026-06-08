-- =====================================================================
-- Trading Chain-of-Custody (material provenance) events
--
-- src/services/custody.service.ts models material provenance for trades:
-- an ordered series of CustodyEvent rows (origin -> extraction ->
-- processing -> transport -> storage -> inspection -> delivery) keyed by
-- order_id / deal_id, each with documents, coordinates and verification
-- metadata. This is a distinct domain from the battery-recycling
-- chain_of_custody table (which tracks battery_inventory transfers), so
-- it gets its own table: custody_events.
--
-- This migration adds:
--   * public.custody_events table + RLS (own-org)
--   * create_custody_event RPC (org-scoped insert)
--   * get_chain_of_custody RPC (ordered events for an order, org-scoped)
--
-- All RPCs are SECURITY DEFINER, search_path locked, org-scoped via the
-- existing JWT helpers, granted to authenticated.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.custody_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  order_id    uuid NOT NULL,
  deal_id     uuid,
  event_type  text NOT NULL CHECK (event_type IN (
                'origin','extraction','processing','transport',
                'storage','inspection','delivery')),
  title       text NOT NULL,
  description text,
  location    text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  verified_by text,
  verified_at timestamptz,
  documents   jsonb NOT NULL DEFAULT '[]'::jsonb,
  coordinates jsonb,
  metadata    jsonb,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custody_events_order ON public.custody_events(order_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_custody_events_deal ON public.custody_events(deal_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_custody_events_org ON public.custody_events(org_id, occurred_at DESC);

ALTER TABLE public.custody_events ENABLE ROW LEVEL SECURITY;

-- Own-org read access
DROP POLICY IF EXISTS "custody_events_select_org" ON public.custody_events;
CREATE POLICY "custody_events_select_org" ON public.custody_events
  FOR SELECT USING (public.is_org_member(org_id));

-- Mutations go through the RPC (SECURITY DEFINER); lock down direct writes.
REVOKE INSERT, UPDATE, DELETE ON public.custody_events FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- RPC: create_custody_event
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_custody_event(
  p_order_id    UUID,
  p_event_type  TEXT,
  p_title       TEXT,
  p_description TEXT DEFAULT NULL,
  p_location    TEXT DEFAULT NULL,
  p_deal_id     UUID DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NULL,
  p_verified_by TEXT DEFAULT NULL,
  p_documents   JSONB DEFAULT '[]'::jsonb,
  p_coordinates JSONB DEFAULT NULL,
  p_metadata    JSONB DEFAULT NULL
)
RETURNS public.custody_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id  UUID;
  v_row     public.custody_events;
BEGIN
  v_user_id := public.jwt_user_id();
  v_org_id  := public.jwt_org_id();

  IF v_user_id IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required with valid user and org context';
  END IF;

  IF NOT public.is_org_member(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized: not a member of this organization';
  END IF;

  IF p_event_type NOT IN ('origin','extraction','processing','transport','storage','inspection','delivery') THEN
    RAISE EXCEPTION 'Invalid event_type: %', p_event_type;
  END IF;

  INSERT INTO public.custody_events (
    org_id, order_id, deal_id, event_type, title, description, location,
    occurred_at, verified_by, verified_at, documents, coordinates, metadata, created_by
  ) VALUES (
    v_org_id, p_order_id, p_deal_id, p_event_type, p_title, p_description, p_location,
    COALESCE(p_occurred_at, now()),
    p_verified_by,
    CASE WHEN p_verified_by IS NOT NULL THEN now() ELSE NULL END,
    COALESCE(p_documents, '[]'::jsonb),
    p_coordinates,
    p_metadata,
    v_user_id
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_custody_event(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TEXT, JSONB, JSONB, JSONB) TO authenticated;

-- ---------------------------------------------------------------------
-- RPC: get_chain_of_custody (ordered events for an order)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_chain_of_custody(
  p_order_id UUID
)
RETURNS SETOF public.custody_events
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.*
  FROM public.custody_events e
  WHERE e.order_id = p_order_id
    AND public.is_org_member(e.org_id)
  ORDER BY e.occurred_at ASC, e.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_chain_of_custody(UUID) TO authenticated;

COMMENT ON TABLE public.custody_events IS
  'Trading material provenance events (origin..delivery) per order/deal. Distinct from battery-recycling chain_of_custody.';
COMMENT ON FUNCTION public.create_custody_event(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TEXT, JSONB, JSONB, JSONB) IS
  'Appends a custody event to an order''s chain of custody (org-scoped).';
COMMENT ON FUNCTION public.get_chain_of_custody(UUID) IS
  'Returns the ordered chain-of-custody events for an order (org-scoped).';
