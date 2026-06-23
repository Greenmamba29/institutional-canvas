-- price_alerts: user-configurable price threshold notifications
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  commodity text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('above','below','change_pct')),
  threshold numeric(15,2) NOT NULL,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_alerts_own_org" ON public.price_alerts
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- supplier_scorecards: computed performance metrics per supplier per org
CREATE TABLE IF NOT EXISTS public.supplier_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  org_id uuid NOT NULL,
  response_rate numeric(5,2) DEFAULT 0,
  avg_response_hours numeric(8,2) DEFAULT 0,
  win_rate numeric(5,2) DEFAULT 0,
  avg_quality_score numeric(3,1) DEFAULT 0,
  on_time_delivery_rate numeric(5,2) DEFAULT 0,
  total_spend_usd numeric(15,2) DEFAULT 0,
  total_orders int DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, org_id)
);
ALTER TABLE public.supplier_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scorecards_own_org" ON public.supplier_scorecards
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- spend_categories: monthly spend tracking by commodity category
CREATE TABLE IF NOT EXISTS public.spend_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  category text NOT NULL,
  month date NOT NULL,
  spend_usd numeric(15,2) NOT NULL DEFAULT 0,
  order_count int NOT NULL DEFAULT 0,
  avg_price_per_mt numeric(12,2),
  UNIQUE(org_id, category, month)
);
ALTER TABLE public.spend_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spend_categories_own_org" ON public.spend_categories
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- RPC: get_procurement_kpis — org-level procurement summary
CREATE OR REPLACE FUNCTION public.get_procurement_kpis(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_rfq_count int;
  v_bid_count int;
  v_deal_count int;
  v_order_count int;
  v_conversion_rate numeric;
  v_avg_bids_per_rfq numeric;
BEGIN
  SELECT COUNT(*) INTO v_rfq_count FROM public.rfqs WHERE org_id = p_org_id;
  SELECT COUNT(*) INTO v_bid_count FROM public.bids b
    JOIN public.rfqs r ON r.id = b.rfq_id WHERE r.org_id = p_org_id AND NOT COALESCE(b.is_withdrawn, false);
  SELECT COUNT(*) INTO v_deal_count FROM public.deals WHERE org_id = p_org_id;
  SELECT COUNT(*) INTO v_order_count FROM public.orders WHERE org_id = p_org_id;

  v_conversion_rate := CASE WHEN v_rfq_count > 0 THEN ROUND((v_deal_count::numeric / v_rfq_count) * 100, 1) ELSE 0 END;
  v_avg_bids_per_rfq := CASE WHEN v_rfq_count > 0 THEN ROUND(v_bid_count::numeric / v_rfq_count, 1) ELSE 0 END;

  v_result := jsonb_build_object(
    'rfq_count', v_rfq_count,
    'bid_count', v_bid_count,
    'deal_count', v_deal_count,
    'order_count', v_order_count,
    'conversion_rate_pct', v_conversion_rate,
    'avg_bids_per_rfq', v_avg_bids_per_rfq
  );

  RETURN v_result;
END;
$$;

-- RPC: get_rfq_funnel — conversion counts for funnel visualization
CREATE OR REPLACE FUNCTION public.get_rfq_funnel(p_org_id uuid)
RETURNS TABLE(stage text, count bigint, label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'rfqs'::text, COUNT(*), 'RFQs Sent'::text FROM public.rfqs WHERE org_id = p_org_id
  UNION ALL
  SELECT 'bids'::text, COUNT(*), 'Bids Received'::text FROM public.bids b
    JOIN public.rfqs r ON r.id = b.rfq_id WHERE r.org_id = p_org_id AND NOT COALESCE(b.is_withdrawn, false)
  UNION ALL
  SELECT 'deals'::text, COUNT(*), 'Deals Awarded'::text FROM public.deals WHERE org_id = p_org_id
  UNION ALL
  SELECT 'orders'::text, COUNT(*), 'Orders Placed'::text FROM public.orders WHERE org_id = p_org_id;
END;
$$;

-- RPC: get_monthly_spend — last N months of deal spend
CREATE OR REPLACE FUNCTION public.get_monthly_spend(p_org_id uuid, p_months int DEFAULT 6)
RETURNS TABLE(month text, spend_usd numeric, deal_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', d.created_at), 'Mon YY') AS month,
    COALESCE(SUM(COALESCE(d.total_value, 0)), 0) AS spend_usd,
    COUNT(*) AS deal_count
  FROM public.deals d
  WHERE d.org_id = p_org_id
    AND d.created_at >= NOW() - (p_months || ' months')::interval
    AND COALESCE(d.offer_decision, '') = 'accepted'
  GROUP BY DATE_TRUNC('month', d.created_at)
  ORDER BY DATE_TRUNC('month', d.created_at) ASC;
END;
$$;
