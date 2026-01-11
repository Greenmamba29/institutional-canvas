-- =====================================================
-- AI GATING INFRASTRUCTURE - Replace Warp/Airtable
-- =====================================================

-- 1. AI Feature Flags Table
CREATE TABLE public.ai_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'off' CHECK (status IN ('on', 'off', 'shadow')),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_ai_feature_flags_key ON public.ai_feature_flags(feature_key);
CREATE INDEX idx_ai_feature_flags_org ON public.ai_feature_flags(org_id);
CREATE INDEX idx_ai_feature_flags_status ON public.ai_feature_flags(status);

-- 2. AI Run Ledger Table (Immutable Audit)
CREATE TABLE public.ai_run_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT UNIQUE NOT NULL,
  feature_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'shadow')),
  input_hash TEXT,
  output_stored_at TEXT,
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('human', 'system', 'ai')),
  actor_id UUID,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_run_ledger_feature ON public.ai_run_ledger(feature_key);
CREATE INDEX idx_ai_run_ledger_status ON public.ai_run_ledger(status);
CREATE INDEX idx_ai_run_ledger_actor ON public.ai_run_ledger(actor_id);
CREATE INDEX idx_ai_run_ledger_started ON public.ai_run_ledger(started_at DESC);

-- 3. Release Gates Table
CREATE TABLE public.release_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('ui', 'api', 'ai', 'financial')),
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed', 'review_required')),
  notion_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_release_gates_type ON public.release_gates(gate_type);
CREATE INDEX idx_release_gates_status ON public.release_gates(status);

-- 4. Risk Flags Table
CREATE TABLE public.risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_type TEXT NOT NULL CHECK (flag_type IN ('kyb', 'financial', 'compliance', 'security', 'ai')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  flagged_by UUID,
  resolved_by UUID,
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_risk_flags_type ON public.risk_flags(flag_type);
CREATE INDEX idx_risk_flags_severity ON public.risk_flags(severity);
CREATE INDEX idx_risk_flags_status ON public.risk_flags(status);
CREATE INDEX idx_risk_flags_entity ON public.risk_flags(entity_type, entity_id);

-- 5. KYB Verification Queue Table
CREATE TABLE public.kyb_verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  verification_tier TEXT NOT NULL CHECK (verification_tier IN ('tier1', 'tier2', 'tier3')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID,
  rejection_reason TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  verification_data JSONB DEFAULT '{}'::jsonb,
  risk_score INTEGER,
  notes TEXT
);

CREATE INDEX idx_kyb_queue_org ON public.kyb_verification_queue(org_id);
CREATE INDEX idx_kyb_queue_status ON public.kyb_verification_queue(status);
CREATE INDEX idx_kyb_queue_tier ON public.kyb_verification_queue(verification_tier);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.ai_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_run_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyb_verification_queue ENABLE ROW LEVEL SECURITY;

-- AI Feature Flags: All authenticated can read, only admins can write
CREATE POLICY "ai_feature_flags_read" ON public.ai_feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ai_feature_flags_admin_write" ON public.ai_feature_flags
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- AI Run Ledger: Insert allowed via RPC, no direct updates (immutable)
CREATE POLICY "ai_run_ledger_read" ON public.ai_run_ledger
  FOR SELECT TO authenticated USING (true);

-- Release Gates: All authenticated can read, only admins can write
CREATE POLICY "release_gates_read" ON public.release_gates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "release_gates_admin_write" ON public.release_gates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Risk Flags: Admins can manage, org members can view their org's flags
CREATE POLICY "risk_flags_admin" ON public.risk_flags
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "risk_flags_org_read" ON public.risk_flags
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- KYB Queue: Admins can manage, org admins can view their own
CREATE POLICY "kyb_queue_admin" ON public.kyb_verification_queue
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "kyb_queue_org_read" ON public.kyb_verification_queue
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RPC FUNCTIONS FOR AI GATING
-- =====================================================

-- 1. Check AI Feature Flag
CREATE OR REPLACE FUNCTION public.check_ai_feature_flag(
  p_feature_key TEXT,
  p_org_id UUID DEFAULT NULL
) RETURNS TABLE (
  is_enabled BOOLEAN,
  is_shadow BOOLEAN,
  feature_status TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (ff.status = 'on') AS is_enabled,
    (ff.status = 'shadow') AS is_shadow,
    ff.status AS feature_status
  FROM ai_feature_flags ff
  WHERE ff.feature_key = p_feature_key
    AND (ff.org_id IS NULL OR ff.org_id = p_org_id)
  ORDER BY ff.org_id NULLS LAST
  LIMIT 1;
  
  -- If no flag found, return disabled
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 'off'::TEXT;
  END IF;
END;
$$;

-- 2. Start AI Run (creates ledger entry)
CREATE OR REPLACE FUNCTION public.start_ai_run(
  p_feature_key TEXT,
  p_trigger_source TEXT,
  p_org_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (
  run_id TEXT,
  ledger_id UUID,
  is_shadow BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_run_id TEXT;
  v_ledger_id UUID;
  v_feature_status TEXT;
  v_is_shadow BOOLEAN;
BEGIN
  -- Check feature flag first
  SELECT feature_status, is_shadow INTO v_feature_status, v_is_shadow
  FROM check_ai_feature_flag(p_feature_key, p_org_id);
  
  IF v_feature_status IS NULL OR v_feature_status = 'off' THEN
    RAISE EXCEPTION 'AI feature % is disabled', p_feature_key;
  END IF;
  
  -- Generate run ID
  v_run_id := 'run_' || replace(gen_random_uuid()::text, '-', '');
  
  -- Create ledger entry
  INSERT INTO ai_run_ledger (
    run_id, feature_key, status, trigger_source, 
    actor_id, org_id, metadata
  ) VALUES (
    v_run_id, p_feature_key, 
    CASE WHEN v_is_shadow THEN 'shadow' ELSE 'started' END,
    p_trigger_source, auth.uid(), p_org_id, p_metadata
  )
  RETURNING id INTO v_ledger_id;
  
  -- Log to activity_log
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
    'ai_run_started', 
    'ai_run', 
    v_ledger_id::text, 
    jsonb_build_object('feature_key', p_feature_key, 'run_id', v_run_id, 'trigger_source', p_trigger_source)
  );
  
  RETURN QUERY SELECT v_run_id, v_ledger_id, v_is_shadow;
END;
$$;

-- 3. Complete AI Run
CREATE OR REPLACE FUNCTION public.complete_ai_run(
  p_run_id TEXT,
  p_output_location TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ledger_id UUID;
  v_current_status TEXT;
BEGIN
  -- Get current status
  SELECT id, status INTO v_ledger_id, v_current_status
  FROM ai_run_ledger
  WHERE run_id = p_run_id;
  
  IF v_ledger_id IS NULL THEN
    RAISE EXCEPTION 'AI run % not found', p_run_id;
  END IF;
  
  -- Update ledger (preserve shadow status)
  UPDATE ai_run_ledger
  SET 
    status = CASE 
      WHEN v_current_status = 'shadow' THEN 'shadow'
      WHEN p_success THEN 'completed' 
      ELSE 'failed' 
    END,
    output_stored_at = p_output_location,
    completed_at = NOW(),
    error_message = p_error_message
  WHERE run_id = p_run_id;
  
  -- Log completion
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'ai_run_completed', 
    'ai_run', 
    v_ledger_id::text, 
    jsonb_build_object('run_id', p_run_id, 'success', p_success, 'was_shadow', v_current_status = 'shadow')
  );
END;
$$;

-- 4. Check Financial Isolation (blocks AI from financial actions)
CREATE OR REPLACE FUNCTION public.check_ai_financial_isolation(
  p_action TEXT,
  p_trigger_source TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_blocked_actions TEXT[] := ARRAY[
    'place_bid', 'authorize_payment', 'change_order_status', 
    'approve_kyb', 'create_escrow', 'release_escrow',
    'create_purchase', 'update_purchase', 'delete_purchase'
  ];
BEGIN
  -- AI cannot perform financial actions
  IF p_trigger_source = 'ai' AND p_action = ANY(v_blocked_actions) THEN
    -- Log the blocked attempt
    INSERT INTO risk_flags (flag_type, severity, entity_type, entity_id, description, metadata)
    VALUES (
      'ai', 
      'high', 
      'blocked_action', 
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'AI attempted blocked financial action: ' || p_action,
      jsonb_build_object('action', p_action, 'trigger_source', p_trigger_source)
    );
    
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 5. Check Release Gate
CREATE OR REPLACE FUNCTION public.check_release_gate(
  p_gate_id TEXT
) RETURNS TABLE (
  is_open BOOLEAN,
  requires_review BOOLEAN,
  gate_status TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (rg.status = 'open') AS is_open,
    (rg.status = 'review_required') AS requires_review,
    rg.status AS gate_status
  FROM release_gates rg
  WHERE rg.gate_id = p_gate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 'not_found'::TEXT;
  END IF;
END;
$$;

-- 6. Create default feature flags
INSERT INTO public.ai_feature_flags (feature_key, name, description, status) VALUES
  ('rfq_document_processing', 'RFQ Document AI Processing', 'AI extraction and analysis of RFQ documents', 'off'),
  ('transcript_summarization', 'Transcript Summarization', 'AI summarization of TeleBuy call transcripts', 'off'),
  ('supplier_matching', 'AI Supplier Matching', 'AI-powered supplier recommendations', 'off'),
  ('price_forecasting', 'Price Forecasting', 'SPOT.ai lithium price predictions', 'off'),
  ('deal_risk_analysis', 'Deal Risk Analysis', 'AI analysis of deal risk factors', 'off')
ON CONFLICT (feature_key) DO NOTHING;

-- 7. Create default release gates
INSERT INTO public.release_gates (gate_id, name, description, gate_type, status) VALUES
  ('UI-MVP', 'MVP UI Release', 'Core MVP UI components', 'ui', 'open'),
  ('API-RFQ', 'RFQ API Gate', 'RFQ creation and management APIs', 'api', 'open'),
  ('API-DEALS', 'Deals API Gate', 'Deal flow APIs', 'api', 'open'),
  ('AI-DOCS', 'AI Document Processing', 'AI document analysis features', 'ai', 'closed'),
  ('FINANCIAL-ESCROW', 'Escrow System', 'Payment escrow functionality', 'financial', 'closed')
ON CONFLICT (gate_id) DO NOTHING;