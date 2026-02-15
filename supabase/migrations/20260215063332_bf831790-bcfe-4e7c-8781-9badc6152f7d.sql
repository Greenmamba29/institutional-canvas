
-- ============================================
-- MVP FIX: RLS policies + RPC fixes
-- ============================================

-- 1. Add fallback SELECT policies for bids, deals, auctions
-- These use org_members lookup instead of jwt_org_id()

CREATE POLICY "bids_select_org_member" ON public.bids
  FOR SELECT TO authenticated USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "deals_select_org_member" ON public.deals
  FOR SELECT TO authenticated USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "auctions_select_authenticated" ON public.auctions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auction_bids_select_authenticated" ON public.auction_bids
  FOR SELECT TO authenticated USING (true);

-- 2. Fix list_rfqs RPC to use org_members instead of jwt_org_id()
CREATE OR REPLACE FUNCTION public.list_rfqs()
RETURNS SETOF rfqs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.rfqs
  WHERE organization_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  )
  ORDER BY created_at DESC;
$$;

-- 3. Clean up conflicting telebuy_sessions RLS policies
-- Drop jwt-based policies, keep org_members-based ones
DROP POLICY IF EXISTS "telebuy_select_org" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_update_org" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_delete_org" ON public.telebuy_sessions;
