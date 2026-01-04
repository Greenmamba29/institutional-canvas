-- Phase 1: Fix handle_new_user trigger that references non-existent account_type column
-- This is causing all signups to fail with 500 errors

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_account_type TEXT;
  v_org_name TEXT;
BEGIN
  -- Get account type from user metadata (defaults to 'buyer')
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer');
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email || '''s Organization');
  
  -- Create profile - FIXED: removed non-existent account_type column
  INSERT INTO public.profiles (id, email, full_name, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free'
  );
  
  -- Create organization with the account type as org_type
  INSERT INTO public.organizations (name, org_type, status)
  VALUES (v_org_name, v_account_type, 'active')
  RETURNING id INTO v_org_id;
  
  -- Add user as owner in org_members
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Phase 3: Add TeleBuy Session RPCs

-- Create TeleBuy session
CREATE OR REPLACE FUNCTION public.create_telebuy_session(
  p_supplier_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_meeting_url TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id UUID;
  v_user_id UUID;
  v_session telebuy_sessions;
BEGIN
  v_user_id := auth.uid();
  
  -- Get current user's org (buyer)
  SELECT org_id INTO v_buyer_id 
  FROM public.org_members 
  WHERE user_id = v_user_id 
  LIMIT 1;
  
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;
  
  INSERT INTO public.telebuy_sessions (
    buyer_id, 
    supplier_id, 
    scheduled_at, 
    meeting_url, 
    notes, 
    status,
    created_by
  )
  VALUES (
    v_buyer_id, 
    p_supplier_id, 
    p_scheduled_at, 
    p_meeting_url, 
    p_notes, 
    'scheduled',
    v_user_id
  )
  RETURNING * INTO v_session;
  
  -- Create notification for supplier
  INSERT INTO public.notifications (org_id, type, title, body, entity_type, entity_id)
  VALUES (
    p_supplier_id,
    'system',
    'New TeleBuy Session Scheduled',
    'A buyer has scheduled a video meeting with you',
    'telebuy_session',
    v_session.id
  );
  
  RETURN v_session;
END;
$$;

-- Update session status
CREATE OR REPLACE FUNCTION public.update_session_status(
  p_session_id UUID,
  p_status TEXT
)
RETURNS telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session telebuy_sessions;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Validate status
  IF p_status NOT IN ('scheduled', 'in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;
  
  -- Update session (only if user is participant)
  UPDATE public.telebuy_sessions
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_session_id
    AND (
      buyer_id IN (SELECT org_id FROM public.org_members WHERE user_id = v_user_id)
      OR supplier_id IN (SELECT org_id FROM public.org_members WHERE user_id = v_user_id)
      OR created_by = v_user_id
    )
  RETURNING * INTO v_session;
  
  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  RETURN v_session;
END;
$$;

-- Add transcript to session
CREATE OR REPLACE FUNCTION public.add_session_transcript(
  p_session_id UUID,
  p_transcript TEXT,
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS telebuy_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session telebuy_sessions;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Update session with transcript
  UPDATE public.telebuy_sessions
  SET 
    transcript = p_transcript,
    ai_summary = p_ai_summary,
    updated_at = NOW()
  WHERE id = p_session_id
    AND (
      buyer_id IN (SELECT org_id FROM public.org_members WHERE user_id = v_user_id)
      OR supplier_id IN (SELECT org_id FROM public.org_members WHERE user_id = v_user_id)
      OR created_by = v_user_id
    )
  RETURNING * INTO v_session;
  
  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  RETURN v_session;
END;
$$;