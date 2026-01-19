-- Update create_telebuy_session RPC to support Google Meet
CREATE OR REPLACE FUNCTION public.create_telebuy_session(
  p_supplier_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_meeting_url TEXT,
  p_notes TEXT DEFAULT NULL,
  p_video_provider TEXT DEFAULT 'daily',
  p_google_meet_link TEXT DEFAULT NULL
)
RETURNS telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_result telebuy_sessions;
BEGIN
  -- Get user's org_id
  SELECT org_id INTO v_org_id FROM profiles WHERE id = auth.uid();
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to an organization';
  END IF;
  
  INSERT INTO telebuy_sessions (
    supplier_id,
    user_id,
    org_id,
    scheduled_at,
    meeting_url,
    notes,
    status,
    video_provider,
    google_meet_link
  ) VALUES (
    p_supplier_id,
    auth.uid(),
    v_org_id,
    p_scheduled_at,
    COALESCE(p_meeting_url, ''),
    p_notes,
    'scheduled',
    COALESCE(p_video_provider, 'daily'),
    p_google_meet_link
  )
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;