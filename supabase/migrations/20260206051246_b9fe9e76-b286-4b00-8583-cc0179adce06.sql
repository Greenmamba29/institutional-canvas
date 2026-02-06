-- ================================================
-- Phase 1: Feature Flags Table + Kill Switch
-- ================================================

-- Create feature_flags table for system-wide controls
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert system_read_only kill switch flag
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('system_read_only', false, 'Global kill switch - blocks all write operations when enabled')
ON CONFLICT (key) DO NOTHING;

-- Insert demo_mode_enabled flag for TeleBuy demo sessions
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('demo_mode_enabled', true, 'Allows demo mode in TeleBuy sessions')
ON CONFLICT (key) DO NOTHING;

-- Insert telebuy_enabled flag
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('telebuy_enabled', true, 'Master toggle for TeleBuy feature')
ON CONFLICT (key) DO NOTHING;

-- Security definer function to check kill switch
CREATE OR REPLACE FUNCTION public.is_system_read_only()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM feature_flags WHERE key = 'system_read_only'),
    false
  );
$$;

-- Helper function to check any feature flag
CREATE OR REPLACE FUNCTION public.check_feature_flag(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM feature_flags WHERE key = p_key),
    false
  );
$$;

-- Enable RLS on feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can modify feature flags
CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ================================================
-- Phase 2: Skill Invocations Audit Table
-- ================================================

CREATE TABLE IF NOT EXISTS public.skill_invocations (
  invocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  skill_version TEXT NOT NULL DEFAULT '1.0.0',
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  input_hash TEXT,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for querying skill invocations
CREATE INDEX IF NOT EXISTS idx_skill_invocations_skill ON skill_invocations(skill_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_org ON skill_invocations(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_user ON skill_invocations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_success ON skill_invocations(success, created_at DESC);

-- Enable RLS on skill_invocations
ALTER TABLE public.skill_invocations ENABLE ROW LEVEL SECURITY;

-- Users can view their own skill invocations
CREATE POLICY "Users can view own skill invocations"
ON public.skill_invocations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_super_admin()
);

-- Service role can insert skill invocations (via Edge Functions)
-- Note: This policy allows inserts for authenticated users during development
-- In production, use service_role only
CREATE POLICY "Authenticated can insert skill invocations"
ON public.skill_invocations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update timestamp trigger for feature_flags
CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_feature_flags_timestamp
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feature_flags_updated_at();