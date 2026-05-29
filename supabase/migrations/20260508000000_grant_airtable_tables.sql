-- Add airtable_id to existing grant tables
ALTER TABLE public.grants ADD COLUMN IF NOT EXISTS airtable_id text UNIQUE;
ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS airtable_id text UNIQUE;
ALTER TABLE public.readiness_scores ADD COLUMN IF NOT EXISTS airtable_id text UNIQUE;
ALTER TABLE public.evidence_documents ADD COLUMN IF NOT EXISTS airtable_id text UNIQUE;

-- partner_matching (enterprise only)
CREATE TABLE IF NOT EXISTS public.partner_matching (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  partner_org_id uuid NOT NULL,
  grant_id uuid REFERENCES public.grants(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('lead','co-applicant','subcontractor')),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','declined')),
  match_score numeric(5,2),
  airtable_id text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_matching ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enterprise_own_org" ON public.partner_matching
  USING (org_id IN (
    SELECT id FROM public.organizations
    WHERE id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    AND subscription_tier = 'enterprise'
  ));

-- funding_pipeline (enterprise only)
CREATE TABLE IF NOT EXISTS public.funding_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid REFERENCES public.grants(id) ON DELETE SET NULL,
  org_id uuid NOT NULL,
  rfq_id uuid,
  po_id uuid,
  stage text NOT NULL DEFAULT 'grant_awarded' CHECK (stage IN ('grant_awarded','rfq_created','po_issued','complete')),
  grant_amount numeric(15,2),
  deployed_amount numeric(15,2) DEFAULT 0,
  remaining_budget numeric(15,2) GENERATED ALWAYS AS (COALESCE(grant_amount,0) - COALESCE(deployed_amount,0)) STORED,
  airtable_id text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funding_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enterprise_own_org" ON public.funding_pipeline
  USING (org_id IN (
    SELECT id FROM public.organizations
    WHERE id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    AND subscription_tier = 'enterprise'
  ));

-- flash_alerts
CREATE TABLE IF NOT EXISTS public.flash_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','critical','opportunity')),
  source text NOT NULL DEFAULT 'system' CHECK (source IN ('airtable','system')),
  airtable_id text UNIQUE,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flash_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_org_or_null" ON public.flash_alerts
  FOR SELECT USING (org_id IS NULL OR org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

-- airtable_sync_log (service role only)
CREATE TABLE IF NOT EXISTS public.airtable_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  airtable_id text,
  supabase_id uuid,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.airtable_sync_log ENABLE ROW LEVEL SECURITY;
-- No SELECT policy — service role bypasses RLS anyway
