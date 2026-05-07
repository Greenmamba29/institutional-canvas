-- ============================================================
-- Paywall — Server-Side Subscription Enforcement
-- ============================================================
-- Adds:
--   1. has_active_subscription()  — true if caller has any paid sub
--   2. has_subscription_tier(required)  — true if caller meets tier
--   3. get_subscription_tier()  — returns caller's current tier
--   4. RLS helper policies on rfqs, purchases, deals tables
--   5. feature_flags seed rows for all known flags (disabled by default)
--
-- No free tier. Minimum required: 'pro'.
-- Admin org_type bypasses all checks.
-- ============================================================

-- ─── Helper: resolve caller's active subscription tier ───────────────────────

CREATE OR REPLACE FUNCTION get_subscription_tier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_type text;
  v_tier     text;
  v_price_id text;
  v_expires  timestamptz;
BEGIN
  -- Admin org type → enterprise bypass
  SELECT o.org_type INTO v_org_type
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE om.user_id = auth.uid()
  LIMIT 1;

  IF v_org_type = 'admin' THEN
    RETURN 'enterprise';
  END IF;

  -- Look up active subscription for this user
  SELECT s.price_id, s.expires_at
  INTO v_price_id, v_expires
  FROM subscriptions s
  WHERE s.user_id = auth.uid()
    AND s.status  = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- No subscription or expired
  IF v_price_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_expires IS NOT NULL AND v_expires < now() THEN
    RETURN NULL;
  END IF;

  -- Resolve tier from price_id naming convention
  IF v_price_id ILIKE '%enterprise%' OR v_price_id ILIKE '%ent_%' THEN
    RETURN 'enterprise';
  ELSE
    RETURN 'pro';
  END IF;
END;
$$;

-- ─── Helper: check caller meets required tier ─────────────────────────────────

CREATE OR REPLACE FUNCTION has_subscription_tier(required_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_tier text := get_subscription_tier();
BEGIN
  IF v_tier IS NULL THEN
    RETURN false;
  END IF;

  RETURN CASE required_tier
    WHEN 'pro'        THEN v_tier IN ('pro', 'enterprise')
    WHEN 'enterprise' THEN v_tier = 'enterprise'
    ELSE false
  END;
END;
$$;

-- ─── Helper: any paid subscription (no free tier) ────────────────────────────

CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN get_subscription_tier() IS NOT NULL;
END;
$$;

-- ─── RLS enforcement on core tables ──────────────────────────────────────────
-- Existing org-isolation policies remain. These add subscription enforcement
-- on top: callers without a paid subscription cannot read/write any core data.

-- rfqs table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rfqs') THEN
    DROP POLICY IF EXISTS "require_paid_subscription_rfqs" ON public.rfqs;
    CREATE POLICY "require_paid_subscription_rfqs"
      ON public.rfqs
      AS RESTRICTIVE
      FOR ALL
      USING (has_active_subscription());
  END IF;
END $$;

-- purchases table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchases') THEN
    DROP POLICY IF EXISTS "require_paid_subscription_purchases" ON public.purchases;
    CREATE POLICY "require_paid_subscription_purchases"
      ON public.purchases
      AS RESTRICTIVE
      FOR ALL
      USING (has_active_subscription());
  END IF;
END $$;

-- deals table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals') THEN
    DROP POLICY IF EXISTS "require_paid_subscription_deals" ON public.deals;
    CREATE POLICY "require_paid_subscription_deals"
      ON public.deals
      AS RESTRICTIVE
      FOR ALL
      USING (has_active_subscription());
  END IF;
END $$;

-- orders table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    DROP POLICY IF EXISTS "require_paid_subscription_orders" ON public.orders;
    CREATE POLICY "require_paid_subscription_orders"
      ON public.orders
      AS RESTRICTIVE
      FOR ALL
      USING (has_active_subscription());
  END IF;
END $$;

-- kyb_verification_queue table — Enterprise adds grant readiness fields later,
-- but verification itself is available to all paid subscribers.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kyb_verification_queue') THEN
    DROP POLICY IF EXISTS "require_paid_subscription_kyb" ON public.kyb_verification_queue;
    CREATE POLICY "require_paid_subscription_kyb"
      ON public.kyb_verification_queue
      AS RESTRICTIVE
      FOR ALL
      USING (has_active_subscription());
  END IF;
END $$;

-- ─── Feature flags — seed all known flags (disabled by default) ──────────────

INSERT INTO feature_flags (key, enabled, description)
VALUES
  -- System
  ('system_read_only',       false, 'Put the entire platform into read-only mode'),
  ('demo_mode_enabled',      false, 'Enable demo mode with synthetic data'),

  -- Pro tier (Phase 1 launch)
  ('grant_tracker',          false, 'Grant opportunity tracker — DOE, DOD, ARPA-E'),
  ('eligibility_engine',     false, 'Org eligibility scoring for grants'),
  ('readiness_dashboard',    false, 'Grant readiness progress dashboard'),
  ('evidence_vault',         false, 'Document vault for grant application evidence'),

  -- Enterprise tier (Phase 1 launch)
  ('telebuy_enabled',        false, 'TeleBuy video negotiation sessions'),
  ('auctions_enabled',       false, 'Auction listing and bidding'),
  ('ai_studio_enabled',      false, 'AI Studio — SPOT.ai market intelligence'),
  ('messages_enabled',       false, 'In-app messaging'),
  ('recycling_enabled',      false, 'Black mass and recycling module'),

  -- Enterprise tier (Phase 2 — deferred)
  ('partner_matching',       false, 'Consortium partner matching engine'),
  ('funding_pipeline',       false, 'Auto RFQ/PO creation on grant award'),

  -- Future
  ('api_access',             false, 'External API and webhook access')

ON CONFLICT (key) DO NOTHING;

-- ─── Grant-related table stubs (Phase 1 schema) ───────────────────────────────
-- These tables are created now so migrations are incremental.
-- Application logic and RLS will be filled in subsequent migrations.

CREATE TABLE IF NOT EXISTS public.grants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  funding_source      text NOT NULL,          -- e.g. 'DOE', 'DOD', 'ARPA-E', 'State'
  category            text,                   -- e.g. 'Battery Materials', 'Critical Minerals'
  amount_min          numeric,
  amount_max          numeric,
  deadline            date,
  eligibility_criteria jsonb DEFAULT '{}',
  application_status  text DEFAULT 'open',    -- open | closed | awarded
  external_url        text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_applications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id     uuid REFERENCES public.grants(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL,
  status       text DEFAULT 'draft',         -- draft | submitted | awarded | rejected
  submitted_at timestamptz,
  awarded_at   timestamptz,
  award_amount numeric,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL UNIQUE,
  score      numeric CHECK (score >= 0 AND score <= 100),
  details    jsonb DEFAULT '{}',             -- breakdown per eligibility criterion
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidence_documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL,
  grant_id   uuid REFERENCES public.grants(id) ON DELETE SET NULL,
  file_path  text NOT NULL,
  doc_type   text,                           -- e.g. 'business_plan', 'financials', 'env_report'
  uploaded_at timestamptz DEFAULT now()
);

-- RLS: require paid subscription on all grant tables
ALTER TABLE public.grants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_documents ENABLE ROW LEVEL SECURITY;

-- Grants are publicly readable to all paid subscribers
CREATE POLICY "paid_subscribers_read_grants"
  ON public.grants FOR SELECT
  USING (has_active_subscription());

-- Grant applications are org-scoped + paid subscription
CREATE POLICY "paid_subscribers_own_grant_applications"
  ON public.grant_applications FOR ALL
  USING (
    has_active_subscription()
    AND org_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Readiness scores — org-scoped
CREATE POLICY "paid_subscribers_own_readiness"
  ON public.readiness_scores FOR ALL
  USING (
    has_active_subscription()
    AND org_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Evidence documents — org-scoped
CREATE POLICY "paid_subscribers_own_evidence"
  ON public.evidence_documents FOR ALL
  USING (
    has_active_subscription()
    AND org_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ─── Extend rfqs and purchases with grant context ─────────────────────────────

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS grant_id       uuid REFERENCES public.grants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS funding_source text;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS grant_id       uuid REFERENCES public.grants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS funding_source text;

-- ─── Admin override column on organizations ───────────────────────────────────
-- Allows manual tier override without needing a Stripe subscription row.
-- Used for design partners, internal accounts, comps.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS override_tier text CHECK (override_tier IN ('pro', 'enterprise'));

-- Update get_subscription_tier() to respect override_tier
CREATE OR REPLACE FUNCTION get_subscription_tier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_type     text;
  v_override     text;
  v_tier         text;
  v_price_id     text;
  v_expires      timestamptz;
BEGIN
  SELECT o.org_type, o.override_tier
  INTO v_org_type, v_override
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE om.user_id = auth.uid()
  LIMIT 1;

  -- Admin org type → enterprise bypass
  IF v_org_type = 'admin' THEN
    RETURN 'enterprise';
  END IF;

  -- Manual override (comps, design partners)
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- Stripe subscription
  SELECT s.price_id, s.expires_at
  INTO v_price_id, v_expires
  FROM subscriptions s
  WHERE s.user_id = auth.uid()
    AND s.status  = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_price_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_expires IS NOT NULL AND v_expires < now() THEN
    RETURN NULL;
  END IF;

  IF v_price_id ILIKE '%enterprise%' OR v_price_id ILIKE '%ent_%' THEN
    RETURN 'enterprise';
  ELSE
    RETURN 'pro';
  END IF;
END;
$$;
