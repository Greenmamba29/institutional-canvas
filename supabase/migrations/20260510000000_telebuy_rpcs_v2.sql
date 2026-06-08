-- =====================================================================
-- TeleBuy RPCs (v2) — written against the LIVE telebuy_sessions schema
--
-- Live columns (verified 2026-06-08): id, supplier_id, user_id, org_id,
-- meeting_url, meeting_id, status, scheduled_at, started_at, ended_at,
-- recording_url, transcript (text), notes, video_provider,
-- google_meet_link, created_at, updated_at.
--
-- create_telebuy_session + update_telebuy_notes already exist and match.
-- The platform also calls update_telebuy_session_status and
-- add_session_transcript (telebuy.service.ts) which were MISSING — added
-- here. list/get reads are added for the orchestration/API surface
-- (the UI itself reads via RLS-protected direct selects).
--
-- Org-scoping: a session belongs to the caller when org_id = jwt_org_id()
-- OR user_id = jwt_user_id() (the buyer side). SECURITY DEFINER, locked
-- search_path, granted to authenticated.
-- =====================================================================

-- ---------------------------------------------------------------------
-- RPC: update_telebuy_session_status
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_telebuy_session_status(
  p_session_id UUID,
  p_status     TEXT
)
RETURNS public.telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.telebuy_sessions;
BEGIN
  UPDATE public.telebuy_sessions s
     SET status = p_status,
         started_at = CASE WHEN p_status = 'in_progress' THEN COALESCE(s.started_at, now()) ELSE s.started_at END,
         ended_at   = CASE WHEN p_status IN ('completed','cancelled') THEN COALESCE(s.ended_at, now()) ELSE s.ended_at END,
         updated_at = now()
   WHERE s.id = p_session_id
     AND (s.org_id = public.jwt_org_id() OR s.user_id = public.jwt_user_id())
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'TeleBuy session not found or not authorized';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_telebuy_session_status(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- RPC: add_session_transcript (stores transcript text; summary -> notes)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_session_transcript(
  p_session_id UUID,
  p_transcript TEXT,
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS public.telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.telebuy_sessions;
BEGIN
  UPDATE public.telebuy_sessions s
     SET transcript = p_transcript,
         notes      = COALESCE(p_ai_summary, s.notes),
         updated_at = now()
   WHERE s.id = p_session_id
     AND (s.org_id = public.jwt_org_id() OR s.user_id = public.jwt_user_id())
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'TeleBuy session not found or not authorized';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_session_transcript(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- RPC: list_telebuy_sessions (org-scoped, optional status filter + limit)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_telebuy_sessions(
  p_status TEXT DEFAULT NULL,
  p_limit  INTEGER DEFAULT NULL
)
RETURNS SETOF public.telebuy_sessions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.telebuy_sessions s
  WHERE (s.org_id = public.jwt_org_id() OR s.user_id = public.jwt_user_id())
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.scheduled_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.list_telebuy_sessions(TEXT, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------
-- RPC: get_telebuy_session (single, org-scoped)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_telebuy_session(
  p_session_id UUID
)
RETURNS public.telebuy_sessions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.telebuy_sessions s
  WHERE s.id = p_session_id
    AND (s.org_id = public.jwt_org_id() OR s.user_id = public.jwt_user_id())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_telebuy_session(UUID) TO authenticated;
