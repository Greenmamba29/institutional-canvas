-- =========================================
-- Organization Enhancements: Subscriptions, Enterprise Buyer, SOE
-- =========================================

-- Update org_type check constraint to include enterprise_buyer and soe
ALTER TABLE public.organizations 
  DROP CONSTRAINT IF EXISTS organizations_org_type_check;

ALTER TABLE public.organizations 
  ADD CONSTRAINT organizations_org_type_check 
  CHECK (org_type IN ('buyer', 'enterprise_buyer', 'supplier', 'soe', 'admin', 'partner'));

-- Add subscription fields
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
  CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'inactive'));

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add enterprise buyer fields
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS is_enterprise BOOLEAN DEFAULT false;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS annual_volume_estimate DECIMAL(15, 2);

-- Add Airtable integration field to suppliers
ALTER TABLE public.suppliers 
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT;

-- Create webhook_events table for logging webhook events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_events_source_idx ON public.webhook_events(source);
CREATE INDEX IF NOT EXISTS webhook_events_processed_at_idx ON public.webhook_events(processed_at);
CREATE INDEX IF NOT EXISTS webhook_events_event_type_idx ON public.webhook_events(event_type);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (via Edge Functions)
-- Users can read their own org's webhook events (if we add org_id later)
DO $$ BEGIN
  DROP POLICY IF EXISTS webhook_events_select_own ON public.webhook_events;
  CREATE POLICY webhook_events_select_own ON public.webhook_events
    FOR SELECT USING (true); -- For now, allow all authenticated users to read (can be restricted later)
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;

-- Lock down direct mutations (only Edge Functions can insert)
REVOKE INSERT, UPDATE, DELETE ON public.webhook_events FROM anon, authenticated;

COMMENT ON TABLE public.webhook_events IS 'Logs all webhook events from external services (Stripe, Airtable, etc.)';
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription tier: free, pro, or enterprise';
COMMENT ON COLUMN public.organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.organizations.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.organizations.is_enterprise IS 'Flag for enterprise buyer organizations';
COMMENT ON COLUMN public.organizations.annual_volume_estimate IS 'Estimated annual volume for enterprise buyers';
