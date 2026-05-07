-- ============================================================
-- Stripe Subscription State Machine
-- ============================================================
-- Adds idempotency tracking, grace period columns, downgrade
-- flow for cancelled subscriptions, and evidence vault read-only.
--
-- Status state machine:
--   active      → full tier access
--   past_due    → grace period (7 days), full access maintained + banner
--   cancelled   → access revoked; evidence vault read-only 30 days
--   expired     → past_due grace elapsed; same effect as cancelled
-- ============================================================

-- ─── Extend subscriptions table ───────────────────────────────────────────────

ALTER TABLE public.subscriptions
  -- Resolved tier stored directly (avoid re-deriving from price_id on every request)
  ADD COLUMN IF NOT EXISTS tier                  text CHECK (tier IN ('pro', 'enterprise')),
  -- Stripe subscription period end (extended on each invoice.paid)
  ADD COLUMN IF NOT EXISTS expires_at            timestamptz,
  -- Set on payment_failed / past_due; access revoked after this date
  ADD COLUMN IF NOT EXISTS grace_period_ends_at  timestamptz,
  -- Set on cancellation; evidence vault deletion scheduled here
  ADD COLUMN IF NOT EXISTS downgrade_scheduled_at timestamptz,
  -- Org this subscription belongs to (for evidence vault downgrade)
  ADD COLUMN IF NOT EXISTS org_id               uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ─── Idempotency: processed Stripe events ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id    text PRIMARY KEY,              -- Stripe evt_xxx id
  event_type  text NOT NULL,
  org_id      uuid,
  status      text NOT NULL DEFAULT 'processed',  -- processed | skipped
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Subscription lifecycle audit trail ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscription_lifecycle_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id      uuid,
  event_type   text NOT NULL,   -- activated | renewed | past_due | grace_expired | cancelled | downgrade_completed | plan_changed
  old_tier     text,
  new_tier     text,
  old_status   text,
  new_status   text,
  stripe_event_id text,
  metadata     jsonb DEFAULT '{}',
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Evidence vault: add read-only flag ───────────────────────────────────────
-- When a subscription is cancelled, docs become read-only.
-- After 30 days they are eligible for deletion.

ALTER TABLE public.evidence_documents
  ADD COLUMN IF NOT EXISTS read_only          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;

-- ─── Admin downgrade notifications ───────────────────────────────────────────
-- Lightweight log so admins can confirm or extend retention before deletion.

CREATE TABLE IF NOT EXISTS public.downgrade_notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  notified_at           timestamptz NOT NULL DEFAULT now(),
  deletion_scheduled_at timestamptz NOT NULL,
  acknowledged_at       timestamptz,           -- set when admin clicks "I confirm"
  retention_extended_to timestamptz,           -- set if admin extends retention
  notes                 text
);

-- ─── Update get_subscription_tier() — grace period awareness ─────────────────
-- Replaces the version from migration 20260507000000.

CREATE OR REPLACE FUNCTION get_subscription_tier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id       uuid;
  v_org_type     text;
  v_override     text;
  v_tier         text;
  v_status       text;
  v_expires      timestamptz;
  v_grace_ends   timestamptz;
BEGIN
  -- Resolve the caller's primary org
  SELECT o.id, o.org_type, o.override_tier
  INTO v_org_id, v_org_type, v_override
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE om.user_id = auth.uid()
  ORDER BY om.created_at
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

  -- No subscription row at all
  IF v_tier IS NULL AND v_status IS NULL THEN
    -- Fall back to legacy price_id-based lookup in case the org was created
    -- before the tier column was backfilled
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

    IF v_tier IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  -- State machine resolution
  CASE v_status
    WHEN 'active' THEN
      -- Check expiry (belt-and-suspenders; Stripe normally keeps status current)
      IF v_expires IS NOT NULL AND v_expires < now() THEN
        RETURN NULL;
      END IF;
      RETURN v_tier;

    WHEN 'past_due' THEN
      -- Grace period: allow access until grace_period_ends_at
      IF v_grace_ends IS NOT NULL AND v_grace_ends > now() THEN
        RETURN v_tier;   -- Still within grace period
      END IF;
      RETURN NULL;       -- Grace elapsed — revoke access

    WHEN 'cancelled', 'expired' THEN
      RETURN NULL;       -- Access revoked immediately on cancellation

    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- ─── Helper: is the org in a grace period right now? ─────────────────────────
-- Used by the frontend to show a "payment overdue" banner without revoking access.

CREATE OR REPLACE FUNCTION is_in_grace_period()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id   uuid;
  v_status   text;
  v_grace    timestamptz;
BEGIN
  SELECT o.id INTO v_org_id
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE om.user_id = auth.uid()
  ORDER BY om.created_at
  LIMIT 1;

  SELECT s.status, s.grace_period_ends_at
  INTO v_status, v_grace
  FROM subscriptions s
  WHERE (s.org_id = v_org_id OR s.user_id = auth.uid())
    AND s.status = 'past_due'
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN v_status = 'past_due' AND v_grace IS NOT NULL AND v_grace > now();
END;
$$;

-- ─── Helper: days remaining in grace period ───────────────────────────────────

CREATE OR REPLACE FUNCTION grace_period_days_remaining()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id   uuid;
  v_grace    timestamptz;
BEGIN
  SELECT o.id INTO v_org_id
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE om.user_id = auth.uid()
  ORDER BY om.created_at
  LIMIT 1;

  SELECT s.grace_period_ends_at INTO v_grace
  FROM subscriptions s
  WHERE (s.org_id = v_org_id OR s.user_id = auth.uid())
    AND s.status = 'past_due'
    AND s.grace_period_ends_at > now()
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_grace IS NULL THEN
    RETURN 0;
  END IF;

  RETURN GREATEST(0, EXTRACT(DAY FROM (v_grace - now()))::integer);
END;
$$;

-- ─── RLS on new tables ────────────────────────────────────────────────────────

ALTER TABLE public.stripe_webhook_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downgrade_notifications    ENABLE ROW LEVEL SECURITY;

-- Only service role / admin can read webhook events
CREATE POLICY "service_only_webhook_events"
  ON public.stripe_webhook_events FOR ALL
  USING (false);   -- blocked for all RLS callers; service role bypasses RLS

-- Orgs can read their own lifecycle events
CREATE POLICY "org_own_lifecycle_events"
  ON public.subscription_lifecycle_events FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Orgs can read and acknowledge their own downgrade notifications
CREATE POLICY "org_own_downgrade_notifications"
  ON public.downgrade_notifications FOR ALL
  USING (
    org_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id
  ON public.subscriptions(org_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_org
  ON public.subscription_lifecycle_events(org_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_downgrade_notifications_org
  ON public.downgrade_notifications(org_id);

CREATE INDEX IF NOT EXISTS idx_evidence_documents_deletion
  ON public.evidence_documents(deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL;
