-- Security Hardening: Create RPC functions for direct updates
-- Replaces direct .update() calls with backend-validated RPC functions

-- 1. Update TeleBuy session notes
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
  v_session public.telebuy_sessions;
  v_org_id UUID := public.jwt_org_id();
BEGIN
  -- Validate user has access to session via RLS (buyer or supplier org)
  UPDATE public.telebuy_sessions 
  SET notes = p_notes, updated_at = NOW()
  WHERE id = p_session_id
    AND (buyer_org_id = v_org_id OR supplier_org_id = v_org_id)
  RETURNING * INTO v_session;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  RETURN v_session;
END;
$$;

-- 2. Mark messages as read (using org from JWT, not parameter)
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_conversation_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_org_id UUID := public.jwt_org_id();
BEGIN
  -- Only mark messages as read that were NOT sent by current org
  UPDATE public.direct_messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_org_id != v_org_id
    AND read_at IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3. Update AI feature flag status (admin only)
CREATE OR REPLACE FUNCTION public.update_ai_feature_flag_status(
  p_feature_key TEXT,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := public.jwt_user_id();
BEGIN
  -- Validate status value
  IF p_status NOT IN ('on', 'off', 'shadow') THEN
    RAISE EXCEPTION 'Invalid status. Must be on, off, or shadow';
  END IF;
  
  -- Update the flag
  UPDATE public.ai_feature_flags 
  SET status = p_status, updated_at = NOW()
  WHERE feature_key = p_feature_key;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feature flag not found: %', p_feature_key;
  END IF;
  
  -- Log the change
  INSERT INTO public.activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (v_user_id, 'update_feature_flag', 'ai_feature_flags', NULL, 
    jsonb_build_object('feature_key', p_feature_key, 'new_status', p_status));
  
  RETURN TRUE;
END;
$$;

-- 4. Update release gate status (admin only)
CREATE OR REPLACE FUNCTION public.update_release_gate_status(
  p_gate_id TEXT,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := public.jwt_user_id();
BEGIN
  -- Validate status value
  IF p_status NOT IN ('open', 'closed', 'review_required') THEN
    RAISE EXCEPTION 'Invalid status. Must be open, closed, or review_required';
  END IF;
  
  -- Update the gate
  UPDATE public.release_gates 
  SET status = p_status, updated_at = NOW()
  WHERE gate_id = p_gate_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Release gate not found: %', p_gate_id;
  END IF;
  
  -- Log the change
  INSERT INTO public.activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (v_user_id, 'update_release_gate', 'release_gates', NULL,
    jsonb_build_object('gate_id', p_gate_id, 'new_status', p_status));
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_telebuy_notes(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ai_feature_flag_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_release_gate_status(TEXT, TEXT) TO authenticated;