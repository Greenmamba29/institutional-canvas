-- =====================================================
-- Missing RPC Functions for RPC-Only Write Enforcement
-- =====================================================

-- 1. Create Quote RPC
CREATE OR REPLACE FUNCTION public.create_quote(
  p_supplier_id UUID,
  p_product_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_requested_price NUMERIC DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_result public.quotes;
BEGIN
  -- Get user's org
  SELECT org_id INTO v_org_id
  FROM public.org_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;
  
  INSERT INTO public.quotes (
    supplier_id,
    product_id,
    quantity,
    requested_price,
    expires_at,
    notes,
    status,
    user_id,
    org_id
  ) VALUES (
    p_supplier_id,
    p_product_id,
    p_quantity,
    p_requested_price,
    p_expires_at,
    p_notes,
    'pending',
    v_user_id,
    v_org_id
  )
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 2. Create Review RPC
CREATE OR REPLACE FUNCTION public.create_review(
  p_supplier_id UUID,
  p_rating INTEGER,
  p_content TEXT,
  p_author TEXT,
  p_company TEXT DEFAULT NULL,
  p_verified_purchase BOOLEAN DEFAULT FALSE
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result public.reviews;
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  INSERT INTO public.reviews (
    supplier_id,
    rating,
    content,
    author,
    company,
    verified_purchase,
    helpful_count,
    user_id
  ) VALUES (
    p_supplier_id,
    p_rating,
    p_content,
    p_author,
    p_company,
    p_verified_purchase,
    0,
    v_user_id
  )
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 3. Increment Review Helpful Count RPC
CREATE OR REPLACE FUNCTION public.increment_review_helpful(
  p_review_id UUID
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.reviews;
BEGIN
  UPDATE public.reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_review_id
  RETURNING * INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  
  RETURN v_result;
END;
$$;

-- 4. Update TeleBuy Session Notes RPC
CREATE OR REPLACE FUNCTION public.update_telebuy_notes(
  p_session_id UUID,
  p_notes TEXT
)
RETURNS public.telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result public.telebuy_sessions;
BEGIN
  UPDATE public.telebuy_sessions
  SET notes = p_notes,
      updated_at = NOW()
  WHERE id = p_session_id
    AND user_id = v_user_id
  RETURNING * INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_quote TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_telebuy_notes TO authenticated;