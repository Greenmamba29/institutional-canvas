
-- All 6 RPCs for KYC, Company Verification, and API Key management

-- Enable pgcrypto for SHA-256 hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- RPC 1: submit_kyc_verification
CREATE OR REPLACE FUNCTION public.submit_kyc_verification(
  p_tier TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_queue_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_tier NOT IN ('bronze', 'silver', 'gold') THEN
    RAISE EXCEPTION 'Invalid tier. Must be bronze, silver, or gold';
  END IF;

  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;

  INSERT INTO public.kyb_verification_queue (org_id, verification_tier, status, submitted_at, notes)
  VALUES (v_org_id, p_tier, 'pending', NOW(), p_notes)
  ON CONFLICT (org_id) DO UPDATE
    SET verification_tier = EXCLUDED.verification_tier,
        status = 'pending',
        submitted_at = NOW(),
        notes = EXCLUDED.notes,
        rejection_reason = NULL,
        reviewed_at = NULL,
        reviewer_id = NULL
  RETURNING id INTO v_queue_id;

  INSERT INTO public.audit_log (user_id, org_id, action, entity_type, entity_id, outcome)
  VALUES (v_user_id, v_org_id, 'submit_kyc', 'kyb_verification_queue', v_queue_id, 'success');

  RETURN jsonb_build_object('ok', true, 'queue_id', v_queue_id, 'tier', p_tier);
END;
$$;

-- RPC 2: upload_kyc_document
CREATE OR REPLACE FUNCTION public.upload_kyc_document(
  p_kyb_queue_id UUID,
  p_document_type TEXT,
  p_file_name TEXT,
  p_file_url TEXT DEFAULT NULL,
  p_file_size_bytes BIGINT DEFAULT NULL,
  p_mime_type TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;

  -- Validate caller owns this queue entry
  IF p_kyb_queue_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.kyb_verification_queue
    WHERE id = p_kyb_queue_id AND org_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'KYC queue entry not found or access denied';
  END IF;

  INSERT INTO public.kyc_documents (
    kyb_queue_id, org_id, document_type, file_name, file_url,
    file_size_bytes, mime_type, expires_at, uploaded_by, status
  ) VALUES (
    p_kyb_queue_id, v_org_id, p_document_type, p_file_name, p_file_url,
    p_file_size_bytes, p_mime_type, p_expires_at, v_user_id, 'uploaded'
  )
  RETURNING id INTO v_doc_id;

  RETURN jsonb_build_object('ok', true, 'document_id', v_doc_id);
END;
$$;

-- RPC 3: admin_review_document
CREATE OR REPLACE FUNCTION public.admin_review_document(
  p_document_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_status NOT IN ('uploaded', 'under_review', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.kyc_documents
  SET status = p_status,
      rejection_reason = p_rejection_reason,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- RPC 4: admin_review_submission
CREATE OR REPLACE FUNCTION public.admin_review_submission(
  p_queue_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_tier TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_status NOT IN ('pending', 'in_review', 'approved', 'rejected', 'escalated') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT org_id, verification_tier INTO v_org_id, v_tier
  FROM public.kyb_verification_queue WHERE id = p_queue_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'KYC submission not found';
  END IF;

  UPDATE public.kyb_verification_queue
  SET status = p_status,
      rejection_reason = p_rejection_reason,
      notes = COALESCE(p_notes, notes),
      reviewed_at = NOW(),
      reviewer_id = v_user_id
  WHERE id = p_queue_id;

  -- If approved, write tier to suppliers table
  IF p_status = 'approved' THEN
    UPDATE public.suppliers
    SET verification_tier = v_tier
    WHERE org_id = v_org_id;

    INSERT INTO public.notifications (org_id, type, title, body, entity_type, entity_id)
    VALUES (v_org_id, 'system', 'Verification Approved',
      'Your ' || v_tier || ' verification has been approved. Your account is now verified.',
      'kyb_verification_queue', p_queue_id);
  ELSIF p_status = 'rejected' THEN
    INSERT INTO public.notifications (org_id, type, title, body, entity_type, entity_id)
    VALUES (v_org_id, 'system', 'Verification Update',
      'Your verification submission requires attention. Please review the feedback.',
      'kyb_verification_queue', p_queue_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', p_status, 'org_id', v_org_id);
END;
$$;

-- RPC 5: create_api_key
CREATE OR REPLACE FUNCTION public.create_api_key(
  p_name TEXT,
  p_scopes TEXT[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_raw_key TEXT;
  v_prefix TEXT;
  v_hashed TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;

  -- Generate raw key: lb_live_ + 32 random bytes base64
  v_raw_key := 'lb_live_' || encode(gen_random_bytes(32), 'base64');
  -- Remove URL-unsafe chars
  v_raw_key := replace(replace(replace(v_raw_key, '+', 'x'), '/', 'y'), '=', '');
  v_prefix := left(v_raw_key, 16) || '...';
  v_hashed := encode(digest(v_raw_key, 'sha256'), 'hex');

  INSERT INTO public.api_keys (org_id, created_by, name, key_hash, key_prefix, scopes)
  VALUES (v_org_id, v_user_id, p_name, v_hashed, v_prefix, p_scopes);

  INSERT INTO public.audit_log (user_id, org_id, action, entity_type, outcome)
  VALUES (v_user_id, v_org_id, 'create_api_key', 'api_keys', 'success');

  RETURN jsonb_build_object('raw_key', v_raw_key, 'prefix', v_prefix, 'name', p_name);
END;
$$;

-- RPC 6: revoke_api_key
CREATE OR REPLACE FUNCTION public.revoke_api_key(
  p_key_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;

  UPDATE public.api_keys
  SET revoked_at = NOW()
  WHERE id = p_key_id AND org_id = v_org_id AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found or already revoked';
  END IF;

  INSERT INTO public.audit_log (user_id, org_id, action, entity_type, entity_id, outcome)
  VALUES (v_user_id, v_org_id, 'revoke_api_key', 'api_keys', p_key_id, 'success');

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- RPC 7: get_kyc_status (for frontend reads)
CREATE OR REPLACE FUNCTION public.get_kyc_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_queue jsonb;
  v_docs jsonb;
BEGIN
  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('submission', null, 'documents', '[]'::jsonb);
  END IF;

  SELECT row_to_json(q)::jsonb INTO v_queue
  FROM public.kyb_verification_queue q WHERE org_id = v_org_id;

  SELECT json_agg(d)::jsonb INTO v_docs
  FROM public.kyc_documents d WHERE org_id = v_org_id;

  RETURN jsonb_build_object(
    'submission', v_queue,
    'documents', COALESCE(v_docs, '[]'::jsonb)
  );
END;
$$;
