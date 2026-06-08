-- ============================================================
-- Self-Serve 3-Day Free Trial
-- ============================================================
-- Kills the "paywall on everything" launch blocker. New orgs get a
-- 3-day full-access trial (no credit card). After the trial window
-- expires, normal subscription gating applies (paid tier required).
--
-- Adds:
--   1. organizations.trial_started_at / trial_ends_at columns
--   2. start_org_trial(p_org_id)  — opens a 3-day window for the org
--   3. tier 'trial' wired into get_subscription_tier() — treated as
--      full (pro-equivalent) access while the trial is active.
--
-- Resolution priority in get_subscription_tier():
--   admin org_type  > override_tier > paid subscription > active trial > NULL
--
-- An ACTIVE trial means now() < organizations.trial_ends_at.
-- ============================================================

-- ─── 1. Trial window columns on organizations ────────────────────────────────

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at    timestamptz;

CREATE INDEX IF NOT EXISTS organizations_trial_ends_at_idx
  ON public.organizations(trial_ends_at);

COMMENT ON COLUMN public.organizations.trial_started_at IS 'When the org''s self-serve free trial began (NULL = never started)';
COMMENT ON COLUMN public.organizations.trial_ends_at IS 'When the org''s free trial expires; full access while now() < this value';

-- ─── 2. RPC: start_org_trial ─────────────────────────────────────────────────
-- Opens a 3-day trial window for the org. Idempotent: if a trial was already
-- started it is NOT reset (prevents trial-stacking abuse). Only members of the
-- org may start its trial.

CREATE OR REPLACE FUNCTION public.start_org_trial(p_org_id uuid)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_member boolean;
  v_org public.organizations;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Caller must belong to the org
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Not authorized to start a trial for this organization';
  END IF;

  -- Only open a window if one was never started (idempotent / no re-trial)
  UPDATE public.organizations
     SET trial_started_at = COALESCE(trial_started_at, now()),
         trial_ends_at    = COALESCE(trial_ends_at, now() + interval '3 days'),
         updated_at       = now()
   WHERE id = p_org_id
  RETURNING * INTO v_org;

  IF v_org.id IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  RETURN v_org;
END;
$$;

-- ─── 3. RPC: org_trial_status ────────────────────────────────────────────────
-- Lightweight read for the frontend: whether the caller's primary org is in an
-- active trial and how many whole days remain.

CREATE OR REPLACE FUNCTION public.org_trial_status()
RETURNS TABLE (is_trial_active boolean, trial_ends_at timestamptz, trial_days_left integer)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_ends timestamptz;
BEGIN
  SELECT o.trial_ends_at
  INTO v_ends
  FROM public.organizations o
  JOIN public.org_members om ON om.org_id = o.id
  WHERE om.user_id = auth.uid()
  ORDER BY o.created_at
  LIMIT 1;

  RETURN QUERY SELECT
    (v_ends IS NOT NULL AND v_ends > now()),
    v_ends,
    CASE
      WHEN v_ends IS NULL OR v_ends <= now() THEN 0
      ELSE CEIL(EXTRACT(EPOCH FROM (v_ends - now())) / 86400.0)::integer
    END;
END;
$$;

-- ─── 4. Wire 'trial' into the tier-check helper ──────────────────────────────
-- Replaces get_subscription_tier() from 20260507000001. Adds an active-trial
-- fallback AFTER paid/override checks, so paying customers keep their real tier
-- and admins keep enterprise. An active trial resolves to 'trial', which the
-- has_subscription_tier() helper treats as meeting the 'pro' bar (full access).

CREATE OR REPLACE FUNCTION public.get_subscription_tier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_org_id       uuid;
  v_org_type     text;
  v_override     text;
  v_trial_ends   timestamptz;
  v_tier         text;
  v_status       text;
  v_expires      timestamptz;
  v_grace_ends   timestamptz;
BEGIN
  -- Resolve the caller's primary org (join via org_members to match the
  -- create_organization / membership model used elsewhere in this app)
  SELECT o.id, o.org_type, o.override_tier, o.trial_ends_at
  INTO v_org_id, v_org_type, v_override, v_trial_ends
  FROM organizations o
  JOIN org_members om ON om.org_id = o.id
  WHERE om.user_id = auth.uid()
  ORDER BY o.created_at
  LIMIT 1;

  -- Admin org type → unconditional enterprise access
  IF v_org_type = 'admin' THEN
    RETURN 'enterprise';
  END IF;

  -- Manual override (design partners, comps, internal accounts)
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- Look up the org's active subscription row
  SELECT s.tier, s.status, s.expires_at, s.grace_period_ends_at
  INTO v_tier, v_status, v_expires, v_grace_ends
  FROM subscriptions s
  WHERE s.org_id = v_org_id
     OR s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Legacy price_id fallback when tier/status columns are unpopulated
  IF v_tier IS NULL AND v_status IS NULL THEN
    SELECT
      CASE
        WHEN s.price_id ILIKE '%enterprise%' OR s.price_id ILIKE '%ent_%' THEN 'enterprise'
        ELSE 'pro'
      END,
      s.status, s.expires_at, s.grace_period_ends_at
    INTO v_tier, v_status, v_expires, v_grace_ends
    FROM subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'past_due')
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  -- Paid subscription state machine
  IF v_status IS NOT NULL THEN
    CASE v_status
      WHEN 'active' THEN
        IF v_expires IS NOT NULL AND v_expires < now() THEN
          -- fall through to trial check below
          NULL;
        ELSE
          RETURN v_tier;
        END IF;

      WHEN 'past_due' THEN
        IF v_grace_ends IS NOT NULL AND v_grace_ends > now() THEN
          RETURN v_tier;   -- still within grace period
        END IF;
        -- grace elapsed → fall through to trial check

      ELSE
        NULL;  -- cancelled / expired / unknown → fall through to trial check
    END CASE;
  END IF;

  -- Active free trial → full (pro-equivalent) access
  IF v_trial_ends IS NOT NULL AND v_trial_ends > now() THEN
    RETURN 'trial';
  END IF;

  RETURN NULL;
END;
$$;

-- ─── 5. Teach has_subscription_tier() about 'trial' ──────────────────────────
-- A 'trial' tier satisfies the 'pro' requirement (full procurement + grant
-- intelligence) but NOT 'enterprise'. Replaces version from 20260507000000.

CREATE OR REPLACE FUNCTION public.has_subscription_tier(required_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_tier text := get_subscription_tier();
BEGIN
  IF v_tier IS NULL THEN
    RETURN false;
  END IF;

  RETURN CASE required_tier
    WHEN 'pro'        THEN v_tier IN ('trial', 'pro', 'enterprise')
    WHEN 'enterprise' THEN v_tier = 'enterprise'
    ELSE false
  END;
END;
$$;

-- has_active_subscription() unchanged: get_subscription_tier() IS NOT NULL,
-- which is now true during an active trial, so trial users pass RLS gates.

GRANT EXECUTE ON FUNCTION public.start_org_trial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_trial_status() TO authenticated;
