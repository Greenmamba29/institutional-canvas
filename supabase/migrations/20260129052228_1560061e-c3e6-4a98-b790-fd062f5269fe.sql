-- =====================================================
-- GATING REWRITE: Identity & Capability System
-- =====================================================

-- 1. Create onboarding_profile_type enum
DO $$ BEGIN
  CREATE TYPE public.onboarding_profile_type AS ENUM (
    'buyer', 'supplier', 'soe', 'investor'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create super_admins table (immutable privilege - SQL-only insertion)
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT
);

COMMENT ON TABLE public.super_admins IS 'Hard gate: only inserted via SQL console/migration. Never writable from app.';

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can only read their own entry
CREATE POLICY "super_admins_read_self" ON public.super_admins
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

-- 3. Create onboarding_profiles table (immutable intent)
CREATE TABLE IF NOT EXISTS public.onboarding_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  profile public.onboarding_profile_type NOT NULL,
  declared_intent JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.onboarding_profiles.locked IS 'Always true after creation. Profile is immutable.';

ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "onboarding_profiles_select_own" ON public.onboarding_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can insert once (no existing profile)
CREATE POLICY "onboarding_profiles_insert_once" ON public.onboarding_profiles
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() 
    AND NOT EXISTS (SELECT 1 FROM public.onboarding_profiles WHERE user_id = auth.uid())
  );

-- NO UPDATE or DELETE policies = immutable by RLS

-- 4. Create capabilities table
CREATE TABLE IF NOT EXISTS public.capabilities (
  key TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read capabilities
CREATE POLICY "capabilities_read_all" ON public.capabilities
  FOR SELECT TO authenticated USING (true);

-- 5. Create profile_capabilities mapping table
CREATE TABLE IF NOT EXISTS public.profile_capabilities (
  profile public.onboarding_profile_type NOT NULL,
  capability_key TEXT NOT NULL REFERENCES public.capabilities(key) ON DELETE CASCADE,
  PRIMARY KEY (profile, capability_key)
);

ALTER TABLE public.profile_capabilities ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read mappings
CREATE POLICY "profile_capabilities_read_all" ON public.profile_capabilities
  FOR SELECT TO authenticated USING (true);

-- 6. Create domain_events table for audit trail
CREATE TABLE IF NOT EXISTS public.domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS domain_events_org_time_idx ON public.domain_events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS domain_events_entity_idx ON public.domain_events(entity_type, entity_id);

ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's events
CREATE POLICY "domain_events_read_org" ON public.domain_events
  FOR SELECT TO authenticated USING (
    org_id IS NULL OR public.is_org_member(org_id)
  );

-- 7. Create helper functions

-- is_super_admin(): Check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  );
$$;

-- get_user_profile(): Get the onboarding profile type for current user
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS public.onboarding_profile_type
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile FROM public.onboarding_profiles WHERE user_id = auth.uid();
$$;

-- has_capability(): Check if current user has a specific capability
CREATE OR REPLACE FUNCTION public.has_capability(p_capability TEXT)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE
      WHEN public.is_super_admin() THEN true
      ELSE EXISTS (
        SELECT 1 
        FROM public.profile_capabilities pc
        WHERE pc.profile = public.get_user_profile()
        AND pc.capability_key = p_capability
      )
    END;
$$;

-- 8. Seed capabilities
INSERT INTO public.capabilities(key, description) VALUES
  ('view_carbon_calc', 'Can view carbon calculator'),
  ('run_carbon_calc', 'Can run & store carbon calculations'),
  ('view_auctions', 'Can view auctions'),
  ('place_bid', 'Can place auction bids'),
  ('create_auction', 'Can create auctions'),
  ('settle_auction', 'Can settle auctions (system only)'),
  ('view_threepl', 'Can view 3PL inventory'),
  ('sync_threepl', 'Can sync 3PL inventory (system/partner only)'),
  ('use_telebuy', 'Can start TeleBuy sessions'),
  ('admin_ops', 'Can perform admin ops (super admin only)'),
  ('view_recycling', 'Can view recycling features'),
  ('create_rfq', 'Can create RFQs'),
  ('view_deals', 'Can view deals'),
  ('manage_org', 'Can manage organization settings'),
  ('use_ai_studio', 'Can access AI Studio features'),
  ('view_data_hub', 'Can access Data Hub')
ON CONFLICT (key) DO NOTHING;

-- 9. Seed profile capabilities

-- Buyers
INSERT INTO public.profile_capabilities(profile, capability_key) VALUES
  ('buyer', 'view_carbon_calc'),
  ('buyer', 'run_carbon_calc'),
  ('buyer', 'view_auctions'),
  ('buyer', 'place_bid'),
  ('buyer', 'view_threepl'),
  ('buyer', 'use_telebuy'),
  ('buyer', 'create_rfq'),
  ('buyer', 'view_deals'),
  ('buyer', 'view_recycling')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO public.profile_capabilities(profile, capability_key) VALUES
  ('supplier', 'view_carbon_calc'),
  ('supplier', 'run_carbon_calc'),
  ('supplier', 'view_auctions'),
  ('supplier', 'create_auction'),
  ('supplier', 'view_threepl'),
  ('supplier', 'use_telebuy'),
  ('supplier', 'view_deals'),
  ('supplier', 'view_recycling'),
  ('supplier', 'sync_threepl')
ON CONFLICT DO NOTHING;

-- SOE (State-Owned Enterprise) - like buyers but with supplier access too
INSERT INTO public.profile_capabilities(profile, capability_key) VALUES
  ('soe', 'view_carbon_calc'),
  ('soe', 'run_carbon_calc'),
  ('soe', 'view_auctions'),
  ('soe', 'place_bid'),
  ('soe', 'create_auction'),
  ('soe', 'view_threepl'),
  ('soe', 'use_telebuy'),
  ('soe', 'create_rfq'),
  ('soe', 'view_deals'),
  ('soe', 'view_recycling')
ON CONFLICT DO NOTHING;

-- Investors (read-only)
INSERT INTO public.profile_capabilities(profile, capability_key) VALUES
  ('investor', 'view_carbon_calc'),
  ('investor', 'view_auctions'),
  ('investor', 'view_threepl'),
  ('investor', 'view_recycling')
ON CONFLICT DO NOTHING;