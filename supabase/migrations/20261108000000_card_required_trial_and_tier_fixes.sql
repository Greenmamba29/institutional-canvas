-- Require a card for every trial, and fix two subscription-tier bugs.
--
-- 1. Card required. Trials no longer start for free in the database:
--    - the BEFORE INSERT trigger that gave every new organization a 3-day
--      trial is dropped;
--    - start_org_trial() keeps its signature (the client still calls it) but no
--      longer opens a trial window.
--    Trials now start only in Stripe Checkout (create-checkout-session), which
--    collects a card up front and grants one 3-day trial per organization.
--    Trials opened before this migration run out on their own (max 3 days).
--
-- 2. get_subscription_tier():
--    - treats Stripe's 'trialing' status like 'active' (card on file);
--    - an active/trialing/past_due-in-grace row with a NULL tier column now
--      resolves to 'pro' instead of NULL, which locked paying customers out.

DROP TRIGGER IF EXISTS trg_set_default_org_trial ON public.organizations;
DROP FUNCTION IF EXISTS public.set_default_org_trial();

CREATE OR REPLACE FUNCTION public.start_org_trial(p_org_id uuid)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org public.organizations;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.org_members WHERE org_id = p_org_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized for this organization';
  END IF;

  -- Card required: trials start in Stripe Checkout, not here. Return the org
  -- unchanged so existing callers keep working.
  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id;
  IF v_org.id IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
  RETURN v_org;
END;
$$;

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
      -- 'trialing' = Stripe trial with a card on file (see create-checkout-session).
      -- COALESCE: an active row with an unpopulated tier column used to return
      -- NULL here and lock a paying customer out.
      WHEN 'active', 'trialing' THEN
        IF v_expires IS NOT NULL AND v_expires < now() THEN
          -- fall through to trial check below
          NULL;
        ELSE
          RETURN COALESCE(v_tier, 'pro');
        END IF;

      WHEN 'past_due' THEN
        IF v_grace_ends IS NOT NULL AND v_grace_ends > now() THEN
          RETURN COALESCE(v_tier, 'pro');   -- still within grace period
        END IF;
        -- grace elapsed → fall through to trial check

      ELSE
        NULL;  -- cancelled / expired / unknown → fall through to trial check
    END CASE;
  END IF;

  -- Legacy card-less trial window. No new windows are opened (see header);
  -- this only lets trials started before this migration run out (max 3 days).
  IF v_trial_ends IS NOT NULL AND v_trial_ends > now() THEN
    RETURN 'trial';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_org_trial(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_org_trial(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_subscription_tier() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_subscription_tier() TO authenticated, service_role;
