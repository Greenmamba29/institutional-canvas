-- =====================================================
-- GATING REWRITE: Phase 2 (RLS Hardening) + mcp_runs table
-- =====================================================

-- 1. Add capability-based RLS to telebuy_sessions
-- First, drop existing policies if any
DROP POLICY IF EXISTS "telebuy_sessions_select_org" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_sessions_insert_org" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_sessions_update_org" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_sessions_delete_org" ON public.telebuy_sessions;

-- Create capability-aware RLS policies for telebuy_sessions
CREATE POLICY "telebuy_sessions_select_org" ON public.telebuy_sessions
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids())
  );

CREATE POLICY "telebuy_sessions_insert_capability" ON public.telebuy_sessions
  FOR INSERT WITH CHECK (
    org_id IN (SELECT get_user_org_ids())
    AND has_capability('use_telebuy')
  );

CREATE POLICY "telebuy_sessions_update_org" ON public.telebuy_sessions
  FOR UPDATE USING (
    org_id IN (SELECT get_user_org_ids())
    AND has_capability('use_telebuy')
  );

CREATE POLICY "telebuy_sessions_delete_org" ON public.telebuy_sessions
  FOR DELETE USING (
    org_id IN (SELECT get_user_org_ids())
    AND has_capability('use_telebuy')
  );

-- 2. Create mcp_runs table for AI agent audit logging
CREATE TABLE IF NOT EXISTS public.mcp_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  user_id UUID,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate NUMERIC(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mcp_runs_run_id ON public.mcp_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_mcp_runs_agent_name ON public.mcp_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_mcp_runs_org_id ON public.mcp_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_mcp_runs_status ON public.mcp_runs(status);
CREATE INDEX IF NOT EXISTS idx_mcp_runs_created_at ON public.mcp_runs(created_at DESC);

-- Enable RLS
ALTER TABLE public.mcp_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for mcp_runs
-- Admins/super_admins can read all
CREATE POLICY "mcp_runs_admin_read" ON public.mcp_runs
  FOR SELECT USING (
    is_super_admin() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Org members can read their org's runs
CREATE POLICY "mcp_runs_org_read" ON public.mcp_runs
  FOR SELECT USING (
    org_id IN (SELECT get_user_org_ids())
  );

-- Only backend/service role can insert (via edge functions)
-- No direct insert policy for authenticated users

-- 3. Create RPC function to log MCP runs (for edge functions)
CREATE OR REPLACE FUNCTION public.log_mcp_run(
  p_run_id TEXT,
  p_agent_name TEXT,
  p_tool_name TEXT,
  p_org_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_input_payload JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO mcp_runs (
    run_id, agent_name, tool_name, org_id, user_id, 
    input_payload, metadata, status
  ) VALUES (
    p_run_id, p_agent_name, p_tool_name, p_org_id, p_user_id,
    p_input_payload, p_metadata, 'started'
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 4. Create RPC to complete an MCP run
CREATE OR REPLACE FUNCTION public.complete_mcp_run(
  p_id UUID,
  p_status TEXT,
  p_output_payload JSONB DEFAULT '{}'::jsonb,
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost_estimate NUMERIC DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mcp_runs SET
    status = p_status,
    output_payload = p_output_payload,
    error_message = p_error_message,
    duration_ms = p_duration_ms,
    tokens_used = p_tokens_used,
    cost_estimate = p_cost_estimate,
    completed_at = now()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_mcp_run TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_mcp_run TO authenticated;