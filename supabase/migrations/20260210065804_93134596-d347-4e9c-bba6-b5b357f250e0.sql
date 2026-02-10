-- Epic 4: Create Order RPC with audit logging and validation
CREATE OR REPLACE FUNCTION public.create_order(
  p_supplier_id UUID,
  p_total_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_quote_id UUID DEFAULT NULL,
  p_org_id UUID DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
  v_user_id UUID;
  v_actual_org_id UUID;
BEGIN
  -- Kill switch check
  IF EXISTS (SELECT 1 FROM feature_flags WHERE key = 'system_read_only' AND enabled = true) THEN
    RAISE EXCEPTION 'System is in read-only mode';
  END IF;
  
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Resolve org_id (use provided or lookup user's org)
  v_actual_org_id := COALESCE(p_org_id, (
    SELECT org_id FROM org_members 
    WHERE user_id = v_user_id 
    LIMIT 1
  ));
  
  IF v_actual_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;
  
  -- Create order
  INSERT INTO orders (
    supplier_id, 
    total_amount, 
    currency, 
    quote_id, 
    org_id, 
    user_id, 
    status, 
    payment_status
  )
  VALUES (
    p_supplier_id, 
    p_total_amount, 
    p_currency, 
    p_quote_id, 
    v_actual_org_id, 
    v_user_id, 
    'pending', 
    'unpaid'
  )
  RETURNING * INTO v_order;
  
  -- Log to domain_events for audit trail
  INSERT INTO domain_events (event_type, entity_type, entity_id, payload, org_id, actor_user_id)
  VALUES (
    'order.created', 
    'order',
    v_order.id,
    jsonb_build_object(
      'order_id', v_order.id,
      'supplier_id', p_supplier_id,
      'amount', p_total_amount,
      'currency', p_currency
    ), 
    v_actual_org_id,
    v_user_id
  );
  
  RETURN v_order;
END;
$$;

-- Epic 4: Update Order Status RPC with state machine validation
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_status TEXT,
  p_payment_status TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
  v_user_id UUID;
  v_old_status TEXT;
BEGIN
  -- Kill switch check
  IF EXISTS (SELECT 1 FROM feature_flags WHERE key = 'system_read_only' AND enabled = true) THEN
    RAISE EXCEPTION 'System is in read-only mode';
  END IF;
  
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get current order (RLS applied via org_members check)
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;
  
  -- Verify user belongs to the order's org
  IF NOT EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = v_user_id AND org_id = v_order.org_id
  ) THEN
    RAISE EXCEPTION 'Access denied - not a member of order organization';
  END IF;
  
  v_old_status := v_order.status;
  
  -- Validate status transition (state machine)
  IF NOT (
    (v_old_status = 'pending' AND p_status IN ('confirmed', 'cancelled')) OR
    (v_old_status = 'confirmed' AND p_status IN ('processing', 'cancelled')) OR
    (v_old_status = 'processing' AND p_status IN ('shipped', 'cancelled')) OR
    (v_old_status = 'shipped' AND p_status IN ('delivered', 'cancelled')) OR
    (v_old_status = 'delivered' AND p_status = 'completed') OR
    (v_old_status = p_status) -- Allow no-op for idempotency
  ) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_old_status, p_status;
  END IF;
  
  -- Update order
  UPDATE orders SET
    status = p_status,
    payment_status = COALESCE(p_payment_status, payment_status),
    updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  -- Log status change (only if actually changed)
  IF v_old_status != p_status THEN
    INSERT INTO domain_events (event_type, entity_type, entity_id, payload, org_id, actor_user_id)
    VALUES (
      'order.status_updated',
      'order',
      p_order_id,
      jsonb_build_object(
        'order_id', p_order_id,
        'old_status', v_old_status,
        'new_status', p_status
      ),
      v_order.org_id,
      v_user_id
    );
  END IF;
  
  RETURN v_order;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status TO authenticated;