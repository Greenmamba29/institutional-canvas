
-- =============================================
-- MVP RLS + RPC Fixes: Data Visibility Migration
-- =============================================

-- 1. Fallback SELECT policies using org_members lookup

-- Bids: Allow org members to see their org's bids
CREATE POLICY "bids_select_org_members" ON public.bids
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = bids.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Deals: Allow org members to see their org's deals
CREATE POLICY "deals_select_org_members" ON public.deals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = deals.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Auctions: Allow org members to see their org's auctions
CREATE POLICY "auctions_select_org_members" ON public.auctions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = auctions.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Auction Bids: Allow org members to see their org's auction bids
CREATE POLICY "auction_bids_select_org_members" ON public.auction_bids
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = auction_bids.org_id
        AND om.user_id = auth.uid()
    )
  );

-- 2. Replace list_rfqs RPC to use org_members instead of JWT claims
CREATE OR REPLACE FUNCTION public.list_rfqs()
RETURNS SETOF public.rfqs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.rfqs r
  WHERE EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = r.organization_id
      AND om.user_id = auth.uid()
  )
  ORDER BY r.created_at DESC;
$$;

-- 3. Drop conflicting TeleBuy RLS policies (if they exist)
DO $$
BEGIN
  -- Drop each policy if it exists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'telebuy_select_org' AND tablename = 'telebuy_sessions') THEN
    DROP POLICY "telebuy_select_org" ON public.telebuy_sessions;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'telebuy_update_org' AND tablename = 'telebuy_sessions') THEN
    DROP POLICY "telebuy_update_org" ON public.telebuy_sessions;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'telebuy_delete_org' AND tablename = 'telebuy_sessions') THEN
    DROP POLICY "telebuy_delete_org" ON public.telebuy_sessions;
  END IF;
END $$;
