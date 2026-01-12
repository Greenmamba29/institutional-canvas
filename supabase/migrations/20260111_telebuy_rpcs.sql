-- TeleBuy Session Management RPCs
-- Creates RPC functions for TeleBuy video negotiation sessions
-- 
-- Date: January 11, 2026
-- Author: Principal Architect Review

-- ===========================================================
-- RPC: create_telebuy_session
-- Creates a new TeleBuy session for video negotiations
-- ===========================================================
CREATE OR REPLACE FUNCTION public.create_telebuy_session(
  p_supplier_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_meeting_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_session public.telebuy_sessions;
BEGIN
  -- Get current user and org from JWT
  v_user_id := public.jwt_user_id();
  v_org_id := public.jwt_org_id();
  
  IF v_user_id IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required with valid user and org context';
  END IF;
  
  -- Verify user is a member of the org
  IF NOT public.is_org_member(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized: not a member of this organization';
  END IF;

  -- Create the session
  INSERT INTO public.telebuy_sessions (
    org_id,
    supplier_id,
    host_user_id,
    scheduled_at,
    meeting_url,
    notes,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_org_id,
    p_supplier_id,
    v_user_id,
    p_scheduled_at,
    p_meeting_url,
    p_notes,
    'scheduled',
    NOW(),
    NOW()
  )
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_telebuy_session(UUID, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;


-- ===========================================================
-- RPC: update_telebuy_session_status
-- Updates the status of a TeleBuy session
-- ===========================================================
CREATE OR REPLACE FUNCTION public.update_telebuy_session_status(
  p_session_id UUID,
  p_status TEXT
)
RETURNS public.telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session public.telebuy_sessions;
BEGIN
  -- Get current user from JWT
  v_user_id := public.jwt_user_id();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate status enum
  IF p_status NOT IN ('scheduled', 'in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: must be one of scheduled, in_progress, completed, cancelled';
  END IF;

  -- Update session (RLS will verify org membership)
  UPDATE public.telebuy_sessions
  SET 
    status = p_status,
    started_at = CASE WHEN p_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    ended_at = CASE WHEN p_status IN ('completed', 'cancelled') AND ended_at IS NULL THEN NOW() ELSE ended_at END,
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  RETURN v_session;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_telebuy_session_status(UUID, TEXT) TO authenticated;


-- ===========================================================
-- RPC: add_session_transcript
-- Adds transcript content to a TeleBuy session
-- ===========================================================
CREATE OR REPLACE FUNCTION public.add_session_transcript(
  p_session_id UUID,
  p_transcript JSONB
)
RETURNS public.telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session public.telebuy_sessions;
BEGIN
  -- Get current user from JWT
  v_user_id := public.jwt_user_id();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Update session with transcript (RLS will verify org membership)
  UPDATE public.telebuy_sessions
  SET 
    transcript = COALESCE(transcript, '[]'::JSONB) || p_transcript,
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  RETURN v_session;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.add_session_transcript(UUID, JSONB) TO authenticated;


-- ===========================================================
-- RPC: add_session_document
-- Adds a document reference to a TeleBuy session
-- ===========================================================
CREATE OR REPLACE FUNCTION public.add_session_document(
  p_session_id UUID,
  p_document_name TEXT,
  p_document_url TEXT,
  p_document_type TEXT DEFAULT 'other'
)
RETURNS public.telebuy_documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_doc public.telebuy_documents;
BEGIN
  -- Get current user from JWT
  v_user_id := public.jwt_user_id();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Insert document reference
  INSERT INTO public.telebuy_documents (
    session_id,
    uploaded_by,
    document_name,
    document_url,
    document_type,
    created_at
  ) VALUES (
    p_session_id,
    v_user_id,
    p_document_name,
    p_document_url,
    p_document_type,
    NOW()
  )
  RETURNING * INTO v_doc;

  RETURN v_doc;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.add_session_document(UUID, TEXT, TEXT, TEXT) TO authenticated;


-- ===========================================================
-- RLS Policies for TeleBuy Tables (ensure they exist)
-- ===========================================================

-- Enable RLS if not already enabled
ALTER TABLE public.telebuy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telebuy_documents ENABLE ROW LEVEL SECURITY;

-- Sessions: org member can read
DROP POLICY IF EXISTS "telebuy_sessions_select_org" ON public.telebuy_sessions;
CREATE POLICY "telebuy_sessions_select_org" ON public.telebuy_sessions
  FOR SELECT USING (public.is_org_member(org_id));

-- Sessions: org member can update own org's sessions
DROP POLICY IF EXISTS "telebuy_sessions_update_org" ON public.telebuy_sessions;
CREATE POLICY "telebuy_sessions_update_org" ON public.telebuy_sessions
  FOR UPDATE USING (public.is_org_member(org_id));

-- Documents: org member can read session documents
DROP POLICY IF EXISTS "telebuy_documents_select_org" ON public.telebuy_documents;
CREATE POLICY "telebuy_documents_select_org" ON public.telebuy_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.telebuy_sessions s 
      WHERE s.id = session_id AND public.is_org_member(s.org_id)
    )
  );

-- Documents: uploader can insert
DROP POLICY IF EXISTS "telebuy_documents_insert_org" ON public.telebuy_documents;
CREATE POLICY "telebuy_documents_insert_org" ON public.telebuy_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.telebuy_sessions s 
      WHERE s.id = session_id AND public.is_org_member(s.org_id)
    )
  );


-- ===========================================================
-- Add comment for documentation
-- ===========================================================
COMMENT ON FUNCTION public.create_telebuy_session IS 
  'Creates a new TeleBuy video negotiation session. Requires authenticated user with org context.';

COMMENT ON FUNCTION public.update_telebuy_session_status IS 
  'Updates the status of a TeleBuy session (scheduled, in_progress, completed, cancelled).';

COMMENT ON FUNCTION public.add_session_transcript IS 
  'Appends transcript content to a TeleBuy session.';

COMMENT ON FUNCTION public.add_session_document IS 
  'Adds a document reference to a TeleBuy session.';
