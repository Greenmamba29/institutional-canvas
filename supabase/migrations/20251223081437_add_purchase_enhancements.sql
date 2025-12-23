-- =========================================
-- Purchase Table Enhancements
-- =========================================

-- Unique index on purchase_id for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_purchase_id_unique ON public.purchases(purchase_id);

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_purchases_org_id ON public.purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org members can read their org's purchases
CREATE POLICY IF NOT EXISTS purchases_select_org
ON public.purchases FOR SELECT
USING (org_id = public.jwt_org_id());

-- RLS Policy: Suppliers can read purchases where they are the supplier
CREATE POLICY IF NOT EXISTS purchases_select_supplier
ON public.purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = purchases.supplier_id
    AND s.org_id = public.jwt_org_id()
  )
);

-- Lock down direct mutations - use RPCs only
REVOKE INSERT, UPDATE, DELETE ON public.purchases FROM anon, authenticated;

-- Create sequence for purchase_id generation
CREATE SEQUENCE IF NOT EXISTS purchases_id_seq START WITH 1;

-- RPC: Create purchase (buyer org only)
CREATE OR REPLACE FUNCTION public.create_purchase(
  p_supplier_id uuid,
  p_deal_id uuid,
  p_rfq_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_total_amount numeric,
  p_currency text,
  p_delivery_date timestamptz,
  p_delivery_location text,
  p_incoterms text
) RETURNS public.purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_row public.purchases;
  v_purchase_id text;
BEGIN
  IF v_org IS NULL THEN RAISE EXCEPTION 'Missing org_id in JWT'; END IF;

  -- Generate unique purchase_id (e.g., PO-2025-001234)
  v_purchase_id := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('purchases_id_seq')::text, 6, '0');

  INSERT INTO public.purchases(
    org_id, created_by, supplier_id, deal_id, rfq_id, product_id,
    purchase_id, quantity, unit_price, total_amount, currency,
    delivery_date, delivery_location, incoterms, status
  )
  VALUES (
    v_org, v_user, p_supplier_id, p_deal_id, p_rfq_id, p_product_id,
    v_purchase_id, p_quantity, p_unit_price, p_total_amount, COALESCE(p_currency, 'USD'),
    p_delivery_date, p_delivery_location, p_incoterms, 'pending'
  )
  RETURNING * INTO v_row;

  -- Notify supplier
  INSERT INTO public.notifications(org_id, type, title, body, entity_type, entity_id)
  SELECT s.org_id, 'system', 'New Purchase Order', 'You have received a new purchase order: ' || v_purchase_id, 'purchase', v_row.id
  FROM public.suppliers s
  WHERE s.id = p_supplier_id;

  RETURN v_row;
END;
$$;

-- RPC: Update purchase status
CREATE OR REPLACE FUNCTION public.update_purchase_status(
  p_purchase_id uuid,
  p_status text
) RETURNS public.purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid := public.jwt_org_id();
  v_row public.purchases;
BEGIN
  IF v_org IS NULL THEN RAISE EXCEPTION 'Missing org_id in JWT'; END IF;

  -- Allow buyer org or supplier org to update status
  UPDATE public.purchases p
  SET status = p_status, updated_at = NOW()
  WHERE p.id = p_purchase_id
    AND (
      p.org_id = v_org
      OR EXISTS (
        SELECT 1 FROM public.suppliers s
        WHERE s.id = p.supplier_id AND s.org_id = v_org
      )
    )
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found or access denied';
  END IF;

  RETURN v_row;
END;
$$;

-- RPC: List purchases for current org
CREATE OR REPLACE FUNCTION public.list_purchases()
RETURNS SETOF public.purchases
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.purchases p
  WHERE p.org_id = public.jwt_org_id()
     OR EXISTS (
       SELECT 1 FROM public.suppliers s
       WHERE s.id = p.supplier_id AND s.org_id = public.jwt_org_id()
     )
  ORDER BY p.created_at DESC;
$$;

-- RPC: Get purchase by purchase_id (human-readable ID)
CREATE OR REPLACE FUNCTION public.get_purchase_by_id(p_purchase_id text)
RETURNS public.purchases
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.purchases p
  WHERE p.purchase_id = p_purchase_id
    AND (
      p.org_id = public.jwt_org_id()
      OR EXISTS (
        SELECT 1 FROM public.suppliers s
        WHERE s.id = p.supplier_id AND s.org_id = public.jwt_org_id()
      )
    );
$$;